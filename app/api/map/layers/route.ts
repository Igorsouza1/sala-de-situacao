import { NextResponse, NextRequest } from "next/server";
import { getAllLayers } from "@/lib/service/layerService";
import { requireAuthWithTenant } from "@/lib/api/require-auth";

export async function GET(request: NextRequest) {
    const { tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

    try {
        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        const minAreaParam = searchParams.get('minArea');
        const maxAreaParam = searchParams.get('maxArea');

        const startDate = startDateParam ? new Date(startDateParam) : undefined;
        const endDate = endDateParam ? new Date(endDateParam) : undefined;
        const minArea = minAreaParam ? parseFloat(minAreaParam) : undefined;
        const maxArea = maxAreaParam ? parseFloat(maxAreaParam) : undefined;

        if (startDate && isNaN(startDate.getTime())) {
            console.warn("Invalid startDate provided");
        }

        const layers = await getAllLayers(tenantId, startDate, endDate, minArea, maxArea);
        return NextResponse.json(layers);
    } catch (error) {
        console.error("Error fetching layers:", error);
        return NextResponse.json(
            { error: "Failed to fetch layers" },
            { status: 500 }
        );
    }
}
