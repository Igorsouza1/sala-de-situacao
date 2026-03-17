import { apiError, apiSuccess } from "@/lib/api/responses"
import { getPluviometriaDequeHistorico } from "@/lib/service/dequeService"

export async function GET() {
  try {
    const data = await getPluviometriaDequeHistorico()
    return apiSuccess(data)
  } catch (error) {
    return apiError(error as string, 500)
  }
}
