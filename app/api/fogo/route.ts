import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllFirmsData } from "@/lib/service/firmsService";
import { resolveScope, parseRegiaoIdParam } from "@/lib/api/scope";



export async function GET(request: Request) {
    const regiaoId = parseRegiaoIdParam(new URL(request.url).searchParams);
    const scope = await resolveScope({ regiaoId });
    if (scope.response) return scope.response;

    try {
        // Sem filtro explícito, consultar todas as Regiões da Organização.
        const fogoData = await getAllFirmsData(scope.tenantId, scope.user.app_metadata?.is_superadmin === true, regiaoId ?? undefined)

        return apiSuccess(fogoData)
    } catch (error) {
        return apiError(error as string, 500)
    }

}
