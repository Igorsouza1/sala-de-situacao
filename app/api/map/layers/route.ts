import { NextResponse, NextRequest } from "next/server";
import { getAllLayers } from "@/lib/service/layerService";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getRegionIdForUser } from "@/lib/api/require-region";

export async function GET(request: NextRequest) {
    const { user, tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate  = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate    = searchParams.get('endDate')   ? new Date(searchParams.get('endDate')!)   : undefined;
        const minArea    = searchParams.get('minArea')   ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea    = searchParams.get('maxArea')   ? parseFloat(searchParams.get('maxArea')!) : undefined;

        // regiaoId: query param > user_access da tabela > null (resolver usa fallback tenant)
        let regiaoId: number | undefined;
        const regiaoParam = searchParams.get('regiao_id');
        if (regiaoParam) {
            regiaoId = parseInt(regiaoParam, 10);
        } else if (user && tenantId) {
            const fromAccess = await getRegionIdForUser(user.id, tenantId);
            regiaoId = fromAccess ?? undefined;
        }

        const layers = await getAllLayers(tenantId, startDate, endDate, minArea, maxArea, regiaoId);
        return NextResponse.json(layers);
    } catch (error) {
        console.error("Error fetching layers:", error);
        return NextResponse.json({ error: "Failed to fetch layers" }, { status: 500 });
    }
}
