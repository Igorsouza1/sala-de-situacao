import { apiError, apiSuccess } from "@/lib/api/responses"
import { getBalnearioDataByDateRange } from "@/lib/service/balnearioService"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const data = await getBalnearioDataByDateRange(startDate || "", endDate || "")
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
