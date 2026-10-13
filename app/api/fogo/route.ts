import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllFirmsData } from "@/lib/service/firmsService";
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope";
import { historyYear } from "@/lib/api/history-year";



export async function GET(request: Request) {
    const scope = await resolveEnvironmentalReadScope(request);
    if (scope.response) return scope.response;
    const year = historyYear(request);
    if (year === undefined) return apiError("Ano inválido", 400);

    try {
        const fogoData = year === null
            ? await getAllFirmsData(scope.tenantId, scope.isSuperadmin, scope.regionFilter)
            : await getAllFirmsData(scope.tenantId, scope.isSuperadmin, scope.regionFilter, year)

        return apiSuccess(fogoData)
    } catch (error) {
        return apiError(error as string, 500)
    }

}
