import { apiError, apiSuccess } from "@/lib/api/responses"
import { getPluviometriaBalnearioHistorico } from "@/lib/service/balnearioService"

export async function GET() {
  try {
    const data = await getPluviometriaBalnearioHistorico()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar histórico de pluviometria do Balneário", 500)
  }
}
