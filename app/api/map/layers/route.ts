import { NextResponse, NextRequest } from "next/server";
import { getAllLayers } from "@/lib/service/layerService";
import { resolveScope, parseRegiaoIdParam } from "@/lib/api/scope";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const scope = await resolveScope({ regiaoId: parseRegiaoIdParam(searchParams) });
    if (scope.response) return scope.response;

    try {
        const startDate  = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate    = searchParams.get('endDate')   ? new Date(searchParams.get('endDate')!)   : undefined;
        const minArea    = searchParams.get('minArea')   ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea    = searchParams.get('maxArea')   ? parseFloat(searchParams.get('maxArea')!) : undefined;

        const metadataOnly = searchParams.get('metadataOnly') === 'true';
        const layers = await getAllLayers(scope.tenantId, startDate, endDate, minArea, maxArea, scope.regiaoId ?? undefined, metadataOnly);
        const cacheHeader = metadataOnly
            ? 'private, max-age=120, stale-while-revalidate=60'
            : 'private, max-age=600, stale-while-revalidate=300';
        return NextResponse.json(layers, {
            headers: { 'Cache-Control': cacheHeader },
        });
    } catch (error) {
        console.error("Error fetching layers:", error);
        return NextResponse.json({ error: "Failed to fetch layers" }, { status: 500 });
    }
}
