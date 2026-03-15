import { apiError, apiSuccess } from "@/lib/api/responses"
import { getSecchiBalnearioIndicador } from "@/lib/service/balnearioService"

export async function GET() {
  try {
    const data = await getSecchiBalnearioIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de Secchi do Balneário", 500)
  }
}
