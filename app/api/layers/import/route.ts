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

const bodySchema = z.object({
  name: z.string().trim().min(1, "Dê um nome à camada.").max(80, "O nome está comprido demais."),
  color: z.string(),
  regiaoId: z.number().int().positive(),
  kind: z.enum(["area", "linha", "ponto", "misto"]),
  dateField: z.string().max(80).optional(),
  yearField: z.string().max(80).optional(),
  years: z.tuple([z.number().int(), z.number().int()]).optional(),
});

// Cria a camada (ainda sem feições). As feições chegam em lotes por /api/layers/import/[slug]/features,
// porque o corpo de uma requisição na Vercel não passa de uns 4 MB.
export async function POST(request: NextRequest) {
  const auth = await requireRole("editor");
  if (auth.response) return auth.response;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Dados incompletos.", 400);
  const { name, color, regiaoId, kind, dateField, yearField, years } = parsed.data;

  // a Região diz a Organização dona da camada; quem não tem acesso a ela não importa nada nela
  const scope = await resolveScope({ regiaoId });
  if (scope.response) return scope.response;

  try {
    const slug = `${slugify(name, { lower: true, strict: true }) || "camada"}-${Math.random().toString(36).slice(2, 7)}`;
    const [{ next }] = (await db.execute<{ next: number }>(sql`
      SELECT COALESCE(MAX(ordering), 0) + 1 AS next FROM monitoramento.layer_catalog
    `)).rows;

    const [created] = await db
      .insert(layerCatalogInMonitoramento)
      .values({
        name,
        slug,
        regiaoId,
        tenantId: scope.tenantId,
        scope: "tenant",
        ordering: Number(next),
        visualConfig: importVisualConfig(kind, color),
        schemaConfig: { source: DROP_IMPORT_SOURCE, dateField, yearField, years },
      })
      .returning({ id: layerCatalogInMonitoramento.id, slug: layerCatalogInMonitoramento.slug });

    revalidateTag(`layerCatalog-${regiaoId}`, { expire: 0 });
    return apiSuccess(created, 201);
  } catch (error) {
    console.error("Erro ao criar camada importada:", error);
    return apiError("Não foi possível criar a camada.", 500);
  }
}
