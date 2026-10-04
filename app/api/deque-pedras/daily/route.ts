import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getDequeDataByDateRange } from "@/lib/service/dequeService"



export async function GET(request: Request) {
  const access = await requireStationAccess("deque-pedras", false)
  if (access.response) return access.response

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    try{
        const dequeData = await getDequeDataByDateRange(access.tenantId!, startDate || "", endDate || "")
        return apiSuccess(dequeData)
    }catch(error){
        return apiError(error as string, 500)
    }
}