import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"
import { resolveScope, parseRegiaoIdParam } from "@/lib/api/scope"

export async function GET(request: Request) {
  const regiaoId = parseRegiaoIdParam(new URL(request.url).searchParams);
  const scope = await resolveScope({ regiaoId });
  if (scope.response) return scope.response;

  try {
    const data = await getAllDesmatamentoDataGroupedByMonthAndYear(scope.tenantId, scope.user.app_metadata?.is_superadmin === true, regiaoId ?? undefined)
    return apiSuccess(data)
  } catch (error: any) {
    return apiError(error?.message || "Erro ao buscar indicador de desmatamento", 500)
  }
}
