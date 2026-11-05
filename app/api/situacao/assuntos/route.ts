import { apiError, apiSuccess } from '@/lib/api/responses'
import { resolveEnvironmentalReadScope } from '@/lib/api/environmental-read-scope'
import { assuntosDaRegiao } from '@/lib/situacao/fontes'
import { lerFontesDaRegiao } from '@/lib/repositories/situacaoFontesRepository'

// GET /api/situacao/assuntos?regiao_id=N — quais assuntos a Situação mostra nesta região e de onde vem cada um (DESIGN.md 13.10).
// A região é obrigatória: sem ela a resposta misturaria as regiões da pessoa.
export async function GET(request: Request) {
  if (!new URL(request.url).searchParams.has('regiao_id')) return apiError('Informe a região.', 400)
  const scope = await resolveEnvironmentalReadScope(request)
  if (scope.response) return scope.response
  const regiaoId = scope.regionFilter as number

  try {
    const fontes = await lerFontesDaRegiao(regiaoId)
    if (!fontes) return apiError('Região não encontrada.', 404)
    return apiSuccess(assuntosDaRegiao(fontes.catalogo, fontes.presenca))
  } catch (error) {
    console.error('Erro ao ler os assuntos da região:', error)
    return apiError('Não foi possível ler os assuntos da região.', 500)
  }
}
