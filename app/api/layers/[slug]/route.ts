import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { requireAuthWithTenant } from '@/lib/api/require-auth'
import { requireWriteRegion } from '@/lib/api/require-write-region'
import { apiError, apiSuccess } from '@/lib/api/responses'
import { layerDeletability } from '@/lib/layer-delete'
import { findLayerEntryBySlug } from '@/lib/repositories/layerRepository'
import { deleteLayerEverywhere } from '@/lib/repositories/layerDeleteRepository'

// DELETE /api/layers/[slug] — exclui a camada e tudo o que é dela (botão direito na lista de Camadas, DESIGN.md 13.1).
// Quem pode: quem escreve na região da camada (dono da Organização, editor da região, superadmin), as mesmas pessoas que importam.
// A tela já esconde o item das camadas protegidas; aqui a regra é conferida de novo, porque a tela não é a garantia.
export async function DELETE(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { user, tenantId, response } = await requireAuthWithTenant()
  if (response || !user || !tenantId) return response ?? apiError('Não autorizado.', 401)
  const isSuperadmin = user.app_metadata?.is_superadmin === true

  const { slug } = await context.params
  const layer = await findLayerEntryBySlug(slug)
  // camada de outra organização não existe para quem não é dela
  if (!layer || (!isSuperadmin && layer.tenantId !== tenantId)) return apiError('Camada não encontrada.', 404)

  const rule = layerDeletability({ slug: layer.slug, scope: layer.scope, tenantId: layer.tenantId, schemaConfig: layer.schemaConfig })
  if (!rule.ok) return apiError(rule.reason, 403)

  if (!isSuperadmin) {
    if (!layer.regiaoId) return apiError('Esta camada vale para toda a organização. Só a administração a remove.', 403)
    const write = await requireWriteRegion(user, tenantId, String(layer.regiaoId))
    if (write.response) return apiError('Seu perfil não pode excluir camadas desta região. Fale com o administrador.', 403)
  }

  try {
    const removed = await deleteLayerEverywhere({ id: layer.id, slug: layer.slug })
    if (layer.regiaoId) revalidateTag(`layerCatalog-${layer.regiaoId}`, { expire: 0 })
    return apiSuccess({ slug: layer.slug, ...removed })
  } catch (error) {
    console.error('Erro ao excluir a camada:', error)
    return apiError('Não foi possível excluir a camada.', 500)
  }
}
