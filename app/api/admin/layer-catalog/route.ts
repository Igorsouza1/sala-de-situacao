import { NextRequest } from "next/server";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { layerCatalogInMonitoramento } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

// GET /api/admin/layer-catalog
// Lista todas as camadas do tenant ordenadas por ordering
export async function GET() {
  const { tenantId, response: authResponse } = await requireAuthWithTenant();
  if (authResponse) return authResponse;

  try {
    const layers = await db
      .select()
      .from(layerCatalogInMonitoramento)
      .where(eq(layerCatalogInMonitoramento.tenantId, tenantId!))
      .orderBy(asc(layerCatalogInMonitoramento.ordering));

    return apiSuccess(layers);
  } catch (error) {
    console.error("layer-catalog GET error:", error);
    return apiError("Falha ao listar camadas.", 500);
  }
}

const createSchema = z.object({
  name:       z.string().min(1),
  slug:       z.string().min(1).regex(/^[a-z0-9-_]+$/, "Slug deve conter apenas letras minúsculas, números, hífens e underscores"),
  scope:      z.enum(["tenant", "region", "global"]).default("tenant"),
  ordering:   z.number().int().default(0),
  regiaoId:   z.number().int().optional(),
  maplibreConfig: z.object({
    type:   z.enum(["fill", "line", "circle", "heatmap"]),
    paint:  z.record(z.string(), z.union([z.string(), z.number()])),
    layout: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  }),
});

// POST /api/admin/layer-catalog
// Cria uma nova camada no catalog (para camadas de upload/layer_data)
export async function POST(request: NextRequest) {
  const { tenantId, response: authResponse } = await requireAuthWithTenant();
  if (authResponse) return authResponse;

  try {
    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON obrigatório.", 400);

    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

    const { name, slug, scope, ordering, regiaoId, maplibreConfig } = parsed.data;

    // Verificar slug único
    const existing = await db.select({ id: layerCatalogInMonitoramento.id })
      .from(layerCatalogInMonitoramento)
      .where(eq(layerCatalogInMonitoramento.slug, slug))
      .limit(1);
    if (existing.length) return apiError(`Slug '${slug}' já existe.`, 409);

    const [created] = await db.insert(layerCatalogInMonitoramento).values({
      name,
      slug,
      tenantId: tenantId!,
      scope,
      ordering,
      regiaoId,
      visualConfig: { maplibre: maplibreConfig },
      schemaConfig: { fields: [], sourceType: "layer_data" },
    }).returning({ id: layerCatalogInMonitoramento.id, slug: layerCatalogInMonitoramento.slug });

    return apiSuccess(created, 201);
  } catch (error) {
    console.error("layer-catalog POST error:", error);
    return apiError("Falha ao criar camada.", 500);
  }
}
