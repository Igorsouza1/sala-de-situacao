import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getBalnearioDataByDateRange } from "@/lib/service/balnearioService"

export async function GET(request: Request) {
  const access = await requireStationAccess("balneario-municipal", false)
  if (access.response) return access.response

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const data = await getBalnearioDataByDateRange(access.tenantId!, startDate || "", endDate || "")
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
