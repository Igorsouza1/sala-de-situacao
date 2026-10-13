export const maxDuration = 60;

import { NextRequest } from "next/server";
import { z } from "zod";
import slugify from "slugify";
import { revalidateTag } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { layerCatalogInMonitoramento } from "@/db/schema";
import { requireRole } from "@/lib/api/require-auth";
import { resolveScope } from "@/lib/api/scope";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { DROP_IMPORT_SOURCE, importVisualConfig } from "@/lib/geo-import/layer-config";
import { MAX_YEAR_BANDS } from "@/lib/geo-import/raster-pack";

const MAX_PNG_BYTES = 4_000_000;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

const metaSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à camada.").max(80, "O nome está comprido demais."),
  color: z.string(),
  regiaoId: z.number().int().positive(),
  mode: z.enum(["bandas", "valores"]),
  width: z.number().int().positive().max(20000),
  height: z.number().int().positive().max(20000),
  bounds: z.tuple([z.number().min(-180), z.number().min(-90), z.number().max(180), z.number().max(90)]),
  bands: z.number().int().min(1).max(MAX_YEAR_BANDS),
  firstYear: z.number().int().min(1900).max(2100).nullable(),
  max: z.number().int().min(1).max(254),
});

// Cria uma camada raster: a linha no catálogo e a imagem empacotada, juntas (se uma falha, nenhuma fica).
// A imagem chega como arquivo (FormData), sem o acréscimo de um terço que o base64 daria.
export async function POST(request: NextRequest) {
  const auth = await requireRole("editor");
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  let metaJson: unknown = null;
  try { metaJson = JSON.parse(String(form?.get("meta") ?? "")); } catch { /* cai na validação abaixo */ }
  const parsed = metaSchema.safeParse(metaJson);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Dados incompletos.", 400);
  if (!(file instanceof File)) return apiError("A imagem do raster é obrigatória.", 400);
  if (file.size > MAX_PNG_BYTES) return apiError("O raster compactado passa do que o mapa guarda. Recorte uma área menor.", 413);

  const png = Buffer.from(await file.arrayBuffer());
  if (!PNG_SIGNATURE.every((b, i) => png[i] === b)) return apiError("A imagem do raster está corrompida.", 400);
  const meta = parsed.data;
  // o PNG diz sua largura e altura (bytes 16 a 23): têm de bater com o que o raster declarou
  if (png.readUInt32BE(16) !== meta.width || png.readUInt32BE(20) !== meta.height) return apiError("A imagem do raster não confere com o tamanho informado.", 400);
  if (meta.mode === "bandas" && meta.firstYear === null) return apiError("Faltou o ano da primeira banda.", 400);

  const scope = await resolveScope({ regiaoId: meta.regiaoId });
  if (scope.response) return scope.response;

  try {
    const slug = `${slugify(meta.name, { lower: true, strict: true }) || "raster"}-${Math.random().toString(36).slice(2, 7)}`;
    const created = await db.transaction(async (tx) => {
      const [{ next }] = (await tx.execute<{ next: number }>(sql`
        SELECT COALESCE(MAX(ordering), 0) + 1 AS next FROM monitoramento.layer_catalog
      `)).rows;
      const years = meta.mode === "bandas" ? [meta.firstYear!, meta.firstYear! + meta.bands - 1] : undefined;
      const [layer] = await tx
        .insert(layerCatalogInMonitoramento)
        .values({
          name: meta.name,
          slug,
          regiaoId: meta.regiaoId,
          tenantId: scope.tenantId,
          scope: "tenant",
          ordering: Number(next),
          visualConfig: importVisualConfig("area", meta.color),
          schemaConfig: {
            source: DROP_IMPORT_SOURCE,
            kind: "raster",
            years,
            raster: { mode: meta.mode, width: meta.width, height: meta.height, bounds: meta.bounds, bands: meta.bands, firstYear: meta.firstYear, max: meta.max },
          },
        })
        .returning({ id: layerCatalogInMonitoramento.id, slug: layerCatalogInMonitoramento.slug });
      await tx.execute(sql`INSERT INTO monitoramento.layer_rasters (layer_id, png) VALUES (${layer.id}, ${png})`);
      return layer;
    });

    revalidateTag(`layerCatalog-${meta.regiaoId}`, { expire: 0 });
    return apiSuccess(created, 201);
  } catch (error) {
    console.error("Erro ao criar camada raster:", error);
    return apiError("Não foi possível salvar o raster.", 500);
  }
}
