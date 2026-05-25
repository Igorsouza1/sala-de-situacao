import { NextResponse, NextRequest } from "next/server";
import { getLayer } from "@/lib/service/layerService";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getRegionIdForUser } from "@/lib/api/require-region";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { user, tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

    const { slug } = await params;

    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate   = searchParams.get('endDate')   ? new Date(searchParams.get('endDate')!)   : undefined;
        const minArea   = searchParams.get('minArea')   ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea   = searchParams.get('maxArea')   ? parseFloat(searchParams.get('maxArea')!) : undefined;

        let regiaoId: number | undefined;
        const regiaoParam = searchParams.get('regiao_id');
        if (regiaoParam) {
            regiaoId = parseInt(regiaoParam, 10);
        } else if (user && tenantId) {
            const fromAccess = await getRegionIdForUser(user.id, tenantId);
            regiaoId = fromAccess ?? undefined;
        }

        const layer = await getLayer(slug, tenantId, startDate, endDate, minArea, maxArea, regiaoId);

        if (!layer) {
            return NextResponse.json({ error: "Layer not found" }, { status: 404 });
        }

        return NextResponse.json(layer);
    } catch (error) {
        console.error(`Error fetching layer ${slug}:`, error);
        return NextResponse.json({ error: "Failed to fetch layer" }, { status: 500 });
    }
}
