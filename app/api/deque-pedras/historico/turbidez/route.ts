import { apiError, apiSuccess } from "@/lib/api/responses"
import { getTurbidezDequeHistorico } from "@/lib/service/dequeService"

export async function GET() {
  try {
    const data = await getTurbidezDequeHistorico()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
