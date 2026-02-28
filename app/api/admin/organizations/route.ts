import { fetchAdminDashboardData } from "@/lib/service/organizationService";
import { apiError, apiSuccess } from "@/lib/api/responses";

// Note: Ensure authorization middleware or checks are added here to verify Super Admin status
export async function GET(request: Request) {
    try {
        const data = await fetchAdminDashboardData();
        return apiSuccess(data);
    } catch (error) {
        console.error("Erro ao buscar dados do Admin:", error);
        return apiError("Falha ao obter os dados do dashboard de admin.", 500);
    }
}
