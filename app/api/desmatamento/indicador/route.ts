import { apiError, apiSuccess } from "@/lib/api/responses"
import { getDesmatamentoIndicador } from "@/lib/service/desmatamentoService"

export async function GET() {
  try {
    const data = await getDesmatamentoIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de desmatamento", 500)
  }
}
