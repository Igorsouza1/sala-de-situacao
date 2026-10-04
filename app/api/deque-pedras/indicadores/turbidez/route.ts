import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getTurbidezIndicador } from "@/lib/service/dequeService"

export async function GET() {
  const access = await requireStationAccess("deque-pedras", false)
  if (access.response) return access.response

  try {
    const data = await getTurbidezIndicador(access.tenantId!)
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de turbidez", 500)
  }
}
