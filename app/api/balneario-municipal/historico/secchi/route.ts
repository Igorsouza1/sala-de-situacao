import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getSecchiBalnearioHistorico } from "@/lib/service/balnearioService"
import { historyYear } from "@/lib/api/history-year"

export async function GET(request: Request) {
  const access = await requireStationAccess("balneario-municipal", false)
  if (access.response) return access.response
  const year = historyYear(request)
  if (year === undefined) return apiError("Ano inválido", 400)

  try {
    const data = await getSecchiBalnearioHistorico(access.tenantId!, year ?? undefined)
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar histórico de Secchi do Balneário", 500)
  }
}
