import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getTurbidezDequeHistorico } from "@/lib/service/dequeService"
import { historyYear } from "@/lib/api/history-year"

export async function GET(request: Request) {
  const access = await requireStationAccess("deque-pedras", false)
  if (access.response) return access.response
  const year = historyYear(request)
  if (year === undefined) return apiError("Ano inválido", 400)

  try {
    const data = await getTurbidezDequeHistorico(access.tenantId!, year ?? undefined)
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
