import { apiError, apiSuccess } from "@/lib/api/responses"
import { getNivelAguaBalnearioIndicador } from "@/lib/service/balnearioService"

export async function GET() {
  try {
    const data = await getNivelAguaBalnearioIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de nível da água do Balneário", 500)
  }
}
