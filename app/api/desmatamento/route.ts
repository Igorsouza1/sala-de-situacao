import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAllDesmatamentoDataGroupedByMonthAndYear } from "@/lib/service/desmatamentoService"
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope"
import { historyYear } from "@/lib/api/history-year"



export async function GET(request: Request){
    const scope = await resolveEnvironmentalReadScope(request);
    if (scope.response) return scope.response;
    const year = historyYear(request)
    if (year === undefined) return apiError("Ano inválido", 400)

    try{
        const desmatamentoData = year === null
            ? await getAllDesmatamentoDataGroupedByMonthAndYear(scope.tenantId, scope.isSuperadmin, scope.regionFilter)
            : await getAllDesmatamentoDataGroupedByMonthAndYear(scope.tenantId, scope.isSuperadmin, scope.regionFilter, year)
        return apiSuccess(desmatamentoData, 200)
    }catch(error){
        return apiError(error as string, 500)
    }
}
