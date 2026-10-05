import { NextResponse, NextRequest } from "next/server";
import { getLayer } from "@/lib/service/layerService";
import { resolveScope } from "@/lib/api/scope";
import { parseRegiaoIdParam } from "@/lib/api/region-id";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const searchParams = request.nextUrl.searchParams;
    const requested = parseRegiaoIdParam(searchParams);
    if (!requested.ok) return NextResponse.json({ error: "ID de região inválido." }, { status: 400 });
    const scope = await resolveScope({ regiaoId: requested.id });
    if (scope.response) return scope.response;

    const { slug } = await params;

    try {
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
        const endDate   = searchParams.get('endDate')   ? new Date(searchParams.get('endDate')!)   : undefined;
        const minArea   = searchParams.get('minArea')   ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea   = searchParams.get('maxArea')   ? parseFloat(searchParams.get('maxArea')!) : undefined;

        const layer = await getLayer(slug, scope.tenantId, startDate, endDate, minArea, maxArea, scope.regiaoId ?? undefined);

        if (!layer) {
            return NextResponse.json({ error: "Layer not found" }, { status: 404 });
        }

        return NextResponse.json(layer, {
            headers: { 'Cache-Control': 'private, max-age=600, stale-while-revalidate=300' },
        });
    } catch (error) {
        console.error(`Error fetching layer ${slug}:`, error);
        return NextResponse.json({ error: "Failed to fetch layer" }, { status: 500 });
    }
}
