import { apiError, apiSuccess } from "@/lib/api/responses"
import { getFocosIndicador } from "@/lib/service/firmsService"

export async function GET() {
  try {
    const data = await getFocosIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de focos de incêndio", 500)
  }
}
