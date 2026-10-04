import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllExpedicoesData } from "@/lib/service/expedicoesService";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";

export async function GET() {
    const { user, tenantId, response } = await requireAuthWithTenant();
    if (response) return response;
    try {
        const isSuperadmin = user?.app_metadata?.is_superadmin === true;
        const regionIds = await getAccessibleRegionIdsForUser(user!.id, tenantId!, isSuperadmin);
        const expedicoesData = await getAllExpedicoesData(tenantId!, isSuperadmin, regionIds);
        return apiSuccess(expedicoesData);
    } catch (error) {
        return apiError(error as string, 500);
    }
}
