import { apiError, apiSuccess } from "@/lib/api/responses"
import { getNivelRioBalnearioHistorico } from "@/lib/service/balnearioService"

export async function GET() {
  try {
    const data = await getNivelRioBalnearioHistorico()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar histórico de nível do rio do Balneário", 500)
  }
}
