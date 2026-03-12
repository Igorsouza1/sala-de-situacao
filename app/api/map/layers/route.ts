import { NextResponse, NextRequest } from "next/server";
import { getAllLayers } from "@/lib/service/layerService";

export async function GET(request: NextRequest) {
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

        // Se datas inválidas, ignora (ou poderia setar default month aqui se não fosse fazer no front)
        if (startDate && isNaN(startDate.getTime())) {
            console.warn("Invalid startDate provided");
        }

        const layers = await getAllLayers(startDate, endDate, minArea, maxArea);
        return NextResponse.json(layers);
    } catch (error) {
        console.error("Error fetching layers:", error);
        return NextResponse.json(
            { error: "Failed to fetch layers" },
            { status: 500 }
        );
    }
}
