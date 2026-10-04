import { apiError, apiSuccess } from "@/lib/api/responses"
import { getFocosIndicador } from "@/lib/service/firmsService"
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope"

export async function GET(request: Request) {
  const scope = await resolveEnvironmentalReadScope(request);
  if (scope.response) return scope.response;

  try {
    const data = await getFocosIndicador(scope.tenantId, scope.isSuperadmin, scope.regionFilter)
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de focos de incêndio", 500)
  }
}
