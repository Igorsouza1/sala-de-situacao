import { NextResponse } from "next/server";
import { getAllLayers } from "@/lib/service/layerService";

export async function GET() {
    try {
        const layers = await getAllLayers();
        return NextResponse.json(layers);
    } catch (error) {
        console.error("Error fetching layers:", error);
        return NextResponse.json(
            { error: "Failed to fetch layers" },
            { status: 500 }
        );
    }
}
