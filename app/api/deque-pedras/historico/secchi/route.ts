import { apiError, apiSuccess } from "@/lib/api/responses"
import { getSecchiDequeHistorico } from "@/lib/service/dequeService"

export async function GET() {
  try {
    const data = await getSecchiDequeHistorico()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
