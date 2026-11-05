import { apiError, apiSuccess } from '@/lib/api/responses'
import { resolveEnvironmentalReadScope } from '@/lib/api/environmental-read-scope'
import { parseRegionIdInput } from '@/lib/api/region-id'
import { recorteDaArea } from '@/lib/service/recorteService'

// GET /api/situacao/recorte?regiao_id=N&camada=slug&area=id — a Situação só dentro de uma área clicada no mapa (um polígono de uma
// camada da região): área queimada e desmatamento de dentro dela. A área precisa ser da região (ou de camada global).
export const maxDuration = 30

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const camada = params.get('camada')?.trim()
  const area = parseRegionIdInput(params.get('area') ?? undefined)
  if (!params.has('regiao_id') || !camada || !area.ok || area.id === null) return apiError('Informe a região, a camada e a área.', 400)
  const scope = await resolveEnvironmentalReadScope(request)
  if (scope.response) return scope.response
  const regiaoId = scope.regionFilter as number

  try {
    const recorte = await recorteDaArea(regiaoId, camada, area.id)
    if (!recorte) return apiError('Área não encontrada nesta região.', 404)
    return apiSuccess(recorte)
  } catch (error) {
    console.error('Erro ao recortar a Situação pela área:', error)
    return apiError('Não foi possível ler os dados desta área.', 500)
  }
}
