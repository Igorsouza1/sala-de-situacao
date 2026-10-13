import { apiError, apiSuccess } from "@/lib/api/responses"
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope"
import { getRelatorioDesmatamento } from "@/lib/service/desmatamentoRelatorioService"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const alertaId = Number(id)
  if (!Number.isSafeInteger(alertaId) || alertaId <= 0) return apiError("ID de alerta inválido.", 400)

  const scope = await resolveEnvironmentalReadScope(request)
  if (scope.response) return scope.response

  try {
    const relatorio = await getRelatorioDesmatamento(
      alertaId, scope.tenantId, scope.isSuperadmin, scope.regionFilter,
    )
    return relatorio ? apiSuccess(relatorio) : apiError("Alerta não encontrado nesta região.", 404)
  } catch (error) {
    console.error("Erro ao buscar relatório de desmatamento:", error)
    return apiError("Não foi possível carregar o relatório de desmatamento.", 500)
  }
}
