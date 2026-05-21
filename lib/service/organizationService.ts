import { getAdminOrganizationsData, AdminOrganizationData } from "@/lib/repositories/organizationRepository";

export async function fetchAdminDashboardData(): Promise<AdminOrganizationData[]> {
    try {
        const data = await getAdminOrganizationsData();
        return data;
    } catch (error) {
        console.error("Error in fetchAdminDashboardData:", error);
        return [];
    }
}
