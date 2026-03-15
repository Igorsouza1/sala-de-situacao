import { apiError, apiSuccess } from "@/lib/api/responses"
import { getJavaliIndicador } from "@/lib/service/javaliService"

export async function GET() {
  try {
    const data = await getJavaliIndicador()
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de avistamentos de javali", 500)
  }
}
