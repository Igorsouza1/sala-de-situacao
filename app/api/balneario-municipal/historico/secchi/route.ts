import { apiError, apiSuccess } from "@/lib/api/responses"
import { getSecchiBalnearioHistorico } from "@/lib/service/balnearioService"

export async function GET() {
  try {
    const data = await getSecchiBalnearioHistorico()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar histórico de Secchi do Balneário", 500)
  }
}
