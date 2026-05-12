import { NextRequest } from "next/server";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { layerCatalogInMonitoramento } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

type RouteContext = { params: Promise<{ slug: string }> };

const maplibreConfigSchema = z.object({
  type:   z.enum(["fill", "line", "circle", "heatmap"]),
  paint:  z.record(z.string(), z.union([z.string(), z.number()])),
  layout: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

const updateSchema = z.object({
  name:           z.string().min(1).optional(),
  ordering:       z.number().int().optional(),
  scope:          z.enum(["tenant", "region", "global"]).optional(),
  maplibreConfig: maplibreConfigSchema.optional(),
}).refine(d => Object.keys(d).length > 0, { message: "Nenhum campo para atualizar." });

// PUT /api/admin/layer-catalog/[slug]
// Atualiza nome, ordering, scope e/ou visual_config.maplibre de uma camada.
// A chave maplibre é mergeada no JSONB existente — baseStyle e rules do Leaflet são preservados.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { tenantId, response: authResponse } = await requireAuthWithTenant();
  if (authResponse) return authResponse;

  try {
    const { slug } = await params;

    // Verifica existência e ownership
    const [entry] = await db.select()
      .from(layerCatalogInMonitoramento)
      .where(eq(layerCatalogInMonitoramento.slug, slug))
      .limit(1);

    if (!entry) return apiError("Camada não encontrada.", 404);
    // tenantId null = modo seed (MULTI_TENANT=false) — skip ownership check
    if (tenantId && entry.tenantId !== tenantId) return apiError("Sem permissão para editar esta camada.", 403);

    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON obrigatório.", 400);

    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) return apiError(parsed.error.issues[0].message, 400);

    const { name, ordering, scope, maplibreConfig } = parsed.data;

    // Campos escalares
    const scalarUpdates: Record<string, unknown> = {};
    if (name     !== undefined) scalarUpdates.name     = name;
    if (ordering !== undefined) scalarUpdates.ordering = ordering;
    if (scope    !== undefined) scalarUpdates.scope    = scope;

    if (maplibreConfig !== undefined) {
      // Merge visual_config.maplibre sem sobrescrever o restante do JSONB
      await db.execute(sql`
        UPDATE monitoramento.layer_catalog
        SET visual_config = jsonb_set(
          COALESCE(visual_config, '{}'::jsonb),
          '{maplibre}',
          ${JSON.stringify(maplibreConfig)}::jsonb
        )
        WHERE slug = ${slug}
      `);
    }

    if (Object.keys(scalarUpdates).length > 0) {
      await db.update(layerCatalogInMonitoramento)
        .set(scalarUpdates as any)
        .where(eq(layerCatalogInMonitoramento.slug, slug));
    }

    return apiSuccess({ message: "Camada atualizada." });
  } catch (error) {
    console.error("layer-catalog PUT error:", error);
    return apiError("Falha ao atualizar camada.", 500);
  }
}

// DELETE /api/admin/layer-catalog/[slug]
// Remove uma camada. Não permite deletar scope=global de outro tenant.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { tenantId, response: authResponse } = await requireAuthWithTenant();
  if (authResponse) return authResponse;

  try {
    const { slug } = await params;

    const [entry] = await db.select()
      .from(layerCatalogInMonitoramento)
      .where(eq(layerCatalogInMonitoramento.slug, slug))
      .limit(1);

    if (!entry) return apiError("Camada não encontrada.", 404);
    // tenantId null = modo seed (MULTI_TENANT=false) — skip ownership check
    if (tenantId && entry.tenantId !== tenantId) return apiError("Sem permissão para remover esta camada.", 403);

    await db.delete(layerCatalogInMonitoramento)
      .where(and(
        eq(layerCatalogInMonitoramento.slug, slug),
        eq(layerCatalogInMonitoramento.tenantId, tenantId!),
      ));

    return apiSuccess({ message: "Camada removida." });
  } catch (error) {
    console.error("layer-catalog DELETE error:", error);
    return apiError("Falha ao remover camada.", 500);
  }
}
