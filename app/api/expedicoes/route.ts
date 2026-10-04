import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllExpedicoesData } from "@/lib/service/expedicoesService";
import { requireAuthWithTenant } from "@/lib/api/require-auth";

export async function GET() {
    const { user, tenantId, response } = await requireAuthWithTenant();
    if (response) return response;
    try {
        const expedicoesData = await getAllExpedicoesData(tenantId!, user?.app_metadata?.is_superadmin === true);
        return apiSuccess(expedicoesData);
    } catch (error) {
        return apiError(error as string, 500);
    }
}
