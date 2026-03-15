import { apiError, apiSuccess } from "@/lib/api/responses"
import { getTurbidezIndicador } from "@/lib/service/dequeService"

export async function GET() {
  try {
    const data = await getTurbidezIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de turbidez", 500)
  }
}
