import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope"



export async function GET(request: Request){
    const scope = await resolveEnvironmentalReadScope(request);
    if (scope.response) return scope.response;

    try{
        const desmatamentoData = await getAllDesmatamentoDataGroupedByMonthAndYear(scope.tenantId, scope.isSuperadmin, scope.regionFilter)
        return apiSuccess(desmatamentoData, 200)
    }catch(error){
        return apiError(error as string, 500)
    }
}
