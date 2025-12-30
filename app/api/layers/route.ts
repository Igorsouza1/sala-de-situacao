import { NextResponse } from "next/server";
import { findAllLayersCatalog } from "@/lib/repositories/layerRepository";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const layers = await findAllLayersCatalog();
        return NextResponse.json(layers);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Erro ao buscar camadas" },
            { status: 500 }
        );
    }
}
