import { apiError, apiSuccess } from "@/lib/api/responses"
import { getPluviometriaBalnearioIndicador } from "@/lib/service/balnearioService"

export async function GET() {
  try {
    const data = await getPluviometriaBalnearioIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de pluviometria do Balneário", 500)
  }
}
