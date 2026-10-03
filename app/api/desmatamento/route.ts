import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"
import { resolveScope, parseRegiaoIdParam } from "@/lib/api/scope"



export async function GET(request: Request){
    const regiaoId = parseRegiaoIdParam(new URL(request.url).searchParams);
    const scope = await resolveScope({ regiaoId });
    if (scope.response) return scope.response;

    try{
        const desmatamentoData = await getAllDesmatamentoDataGroupedByMonthAndYear(scope.tenantId, scope.user.app_metadata?.is_superadmin === true, regiaoId ?? undefined)
        return apiSuccess(desmatamentoData, 200)
    }catch(error){
        return apiError(error as string, 500)
    }
}
