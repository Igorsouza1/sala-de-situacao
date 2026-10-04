import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllFirmsData } from "@/lib/service/firmsService";
import { resolveEnvironmentalReadScope } from "@/lib/api/environmental-read-scope";



export async function GET(request: Request) {
    const scope = await resolveEnvironmentalReadScope(request);
    if (scope.response) return scope.response;

    try {
        const fogoData = await getAllFirmsData(scope.tenantId, scope.isSuperadmin, scope.regionFilter)

        return apiSuccess(fogoData)
    } catch (error) {
        return apiError(error as string, 500)
    }

}
