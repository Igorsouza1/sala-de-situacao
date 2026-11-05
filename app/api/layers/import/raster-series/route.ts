export const maxDuration = 60;

import { NextRequest } from "next/server";
import { inflateSync } from "node:zlib";
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
import { seriesMetaSchema, SERIES_FORMAT, SERIES_SWATCH, FIRE_SWATCH, MAX_SERIES_STORED_BYTES } from "@/lib/geo-import/series-meta";

// Cria uma camada de série de anos (raster de classes): a linha no catálogo e a série codificada, juntas (se uma falha, nenhuma fica).
// A série chega como arquivo (FormData). Antes de gravar, ela é aberta aqui: tem de ter exatamente um byte por pixel por ano.
export async function POST(request: NextRequest) {
  const auth = await requireRole("editor");
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("series");
  let metaJson: unknown = null;
  try { metaJson = JSON.parse(String(form?.get("meta") ?? "")); } catch { /* cai na validação abaixo */ }
  const parsed = seriesMetaSchema.safeParse(metaJson);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Dados incompletos.", 400);
  if (!(file instanceof File)) return apiError("A série do raster é obrigatória.", 400);
  if (file.size > MAX_SERIES_STORED_BYTES) return apiError("A série compactada passa do que o mapa guarda. Recorte uma área menor.", 413);

  const meta = parsed.data;
  const data = Buffer.from(await file.arrayBuffer());
  const expected = meta.width * meta.height * meta.years.length;
  try {
    const raw = inflateSync(data, { maxOutputLength: expected });
    if (raw.length !== expected) throw new Error("tamanho");
  } catch {
    return apiError("A série do raster está corrompida ou não confere com o tamanho informado.", 400);
  }

  const scope = await resolveScope({ regiaoId: meta.regiaoId });
  if (scope.response) return scope.response;

  try {
    const slug = `${slugify(meta.name, { lower: true, strict: true }) || "serie"}-${Math.random().toString(36).slice(2, 7)}`;
    const years = meta.years;
    const legend = meta.legend ?? (meta.mapbiomas ? "mapbiomas" : "classes");
    const created = await db.transaction(async (tx) => {
      const [{ next }] = (await tx.execute<{ next: number }>(sql`
        SELECT COALESCE(MAX(ordering), 0) + 1 AS next FROM monitoramento.layer_catalog
      `)).rows;
      const [layer] = await tx
        .insert(layerCatalogInMonitoramento)
        .values({
          name: meta.name,
          slug,
          regiaoId: meta.regiaoId,
          tenantId: scope.tenantId,
          scope: "tenant",
          ordering: Number(next),
          visualConfig: importVisualConfig("area", legend === "meses" ? FIRE_SWATCH : SERIES_SWATCH),
          schemaConfig: {
            source: DROP_IMPORT_SOURCE,
            kind: "raster",
            years: [years[0], years[years.length - 1]],
            raster: {
              mode: "classes",
              width: meta.width,
              height: meta.height,
              bounds: meta.bounds,
              bands: years.length,
              firstYear: years[0],
              max: 1,
              years,
              stats: meta.stats,
              mapbiomas: meta.mapbiomas,
              legend,
            },
          },
        })
        .returning({ id: layerCatalogInMonitoramento.id, slug: layerCatalogInMonitoramento.slug });
      await tx.execute(sql`INSERT INTO monitoramento.layer_raster_series (layer_id, format, data) VALUES (${layer.id}, ${SERIES_FORMAT}, ${data})`);
      return layer;
    });

    revalidateTag(`layerCatalog-${meta.regiaoId}`, { expire: 0 });
    return apiSuccess(created, 201);
  } catch (error) {
    console.error("Erro ao criar camada de série de anos:", error);
    return apiError("Não foi possível salvar a série.", 500);
  }
}
