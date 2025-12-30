import { NextRequest, NextResponse } from "next/server";
import { getLayerCatalog, insertLayerData } from "@/lib/repositories/layerRepository";

export async function POST(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug;
        const body = await request.json();
        const { geojson, properties } = body;

        // 1. Validar Slug e buscar Layer ID
        const layer = await getLayerCatalog(slug);
        if (!layer) {
            return NextResponse.json(
                { success: false, error: "Camada não encontrada" },
                { status: 404 }
            );
        }

        // 2. Validar Input Básico
        if (!geojson || !properties) {
            return NextResponse.json(
                { success: false, error: "Dados inválidos: geojson e properties são obrigatórios" },
                { status: 400 }
            );
        }

        // 3. Inserir Dados
        await insertLayerData(layer.id, geojson, properties);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Erro ao inserir dados na camada:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Erro interno" },
            { status: 500 }
        );
    }
}
