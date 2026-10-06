import { NextRequest } from 'next/server'
import { requireAuthWithTenant, requireRole } from '@/lib/api/require-auth'
import { apiError, apiSuccess } from '@/lib/api/responses'
import { LayerEditError, layerEditSchema, updateLayerEdit } from '@/lib/service/layerStyleService'
import { db } from '@/db'
import { layerCatalogInMonitoramento } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ slug: string }> }

// PUT /api/admin/layer-catalog/[slug]
// Edita a aparência de uma camada: nome, seção, "abre ligada", cores, espessura, tamanho do ponto e ícone.
// Quem pode: owner da organização dona da camada, ou o superadmin (camada global só ele). O slug não muda.
// O que não é aparência (rules, popupFields, groupByColumn…) passa intacto. Devolve o visual_config novo, para o mapa se atualizar sem buscar de novo.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { user, tenantId, response } = await requireRole('owner')
  if (response || !user || !tenantId) return response ?? apiError('Não autorizado.', 401)

  const json = await request.json().catch(() => null)
  if (!json) return apiError('Body JSON obrigatório.', 400)

  const parsed = layerEditSchema.safeParse(json)
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Dados inválidos.', 400)

  try {
    const { slug } = await params
    const result = await updateLayerEdit(slug, parsed.data, { tenantId, isSuperadmin: user.app_metadata?.is_superadmin === true })
    return apiSuccess(result)
  } catch (error) {
    if (error instanceof LayerEditError) return apiError(error.message, error.status)
    console.error('layer-catalog PUT error:', error)
    return apiError('Falha ao atualizar a camada.', 500)
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
