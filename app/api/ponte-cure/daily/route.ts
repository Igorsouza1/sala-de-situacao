import { apiError, apiSuccess } from "@/lib/api/responses"
import { getPonteDataByDateRange } from "@/lib/service/ponteService"



export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    try{
        const dequeData = await getPonteDataByDateRange(startDate || "", endDate || "")
        return apiSuccess(dequeData)
    }catch(error){
        return apiError(error as string, 500)
    }
}