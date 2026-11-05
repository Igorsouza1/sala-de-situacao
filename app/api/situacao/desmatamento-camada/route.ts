import { apiError, apiSuccess } from '@/lib/api/responses'
import { resolveEnvironmentalReadScope } from '@/lib/api/environmental-read-scope'
import { desmatamentoPorAnoMes, ehCamadaDeDesmatamento } from '@/lib/situacao/fontes'
import { lerAlertasDaCamada } from '@/lib/repositories/situacaoFontesRepository'
import { findLayerEntryBySlug } from '@/lib/repositories/layerRepository'

// GET /api/situacao/desmatamento-camada?regiao_id=N&slug=… — os alertas de desmatamento de uma camada importada (ex.: MapBiomas
// Alerta da Rede Amolar), somados por ano e mês no mesmo formato de /api/desmatamento: o cartão e o gráfico da Situação são os mesmos.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const slug = params.get('slug')
  if (!params.has('regiao_id') || !slug || slug.length > 120) return apiError('Informe a região e a camada.', 400)
  const scope = await resolveEnvironmentalReadScope(request)
  if (scope.response) return scope.response
  const regiaoId = scope.regionFilter as number

  try {
    const layer = await findLayerEntryBySlug(slug)
    // só uma camada de desmatamento da própria região: a rota não serve para ler qualquer camada
    if (!layer || layer.regiaoId !== regiaoId || !ehCamadaDeDesmatamento({ slug: layer.slug, name: layer.name, schemaConfig: layer.schemaConfig })) {
      return apiError('Camada não encontrada.', 404)
    }
    const linhas = await lerAlertasDaCamada(regiaoId, slug)
    if (!linhas) return apiError('Camada não encontrada.', 404)
    return apiSuccess(desmatamentoPorAnoMes(linhas))
  } catch (error) {
    console.error('Erro ao ler o desmatamento da camada:', error)
    return apiError('Não foi possível ler o desmatamento da camada.', 500)
  }
}
