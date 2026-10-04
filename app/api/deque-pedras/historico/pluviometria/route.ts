import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getPluviometriaDequeHistorico } from "@/lib/service/dequeService"

export async function GET() {
  const access = await requireStationAccess("deque-pedras", false)
  if (access.response) return access.response

  try {
    const data = await getPluviometriaDequeHistorico(access.tenantId!)
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
