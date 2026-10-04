import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope"

export async function GET(request: Request) {
  const scope = await resolveEnvironmentalReadScope(request);
  if (scope.response) return scope.response;

  try {
    const data = await getAllDesmatamentoDataGroupedByMonthAndYear(scope.tenantId, scope.isSuperadmin, scope.regionFilter)
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de desmatamento", 500)
  }
}
