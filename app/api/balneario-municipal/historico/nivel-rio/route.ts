import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getNivelRioBalnearioHistorico } from "@/lib/service/balnearioService"

export async function GET() {
  const access = await requireStationAccess("balneario-municipal", false)
  if (access.response) return access.response

  try {
    const data = await getNivelRioBalnearioHistorico(access.tenantId!)
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar histórico de nível do rio do Balneário", 500)
  }
}
