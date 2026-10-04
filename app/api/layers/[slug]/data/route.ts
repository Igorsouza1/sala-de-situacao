import { requireRole } from "@/lib/api/require-auth";
import { NextRequest, NextResponse } from "next/server";
import { getLayerCatalog, insertLayerData } from "@/lib/repositories/layerRepository";

export async function POST(
    request: NextRequest,
    // 1. Update the type to expect a Promise
    { params }: { params: Promise<{ slug: string }> }
) {
    const auth = await requireRole("editor");
    if (auth.response) return auth.response;
    try {
        // 2. Await the params to extract the slug
        const { slug } = await params;

        const body = await request.json();
        const { geojson, properties } = body;

        // 3. Validar Slug e buscar Layer ID
        const layer = await getLayerCatalog(slug, auth.user?.app_metadata?.is_superadmin === true ? undefined : auth.tenantId!);
        if (!layer) {
            return NextResponse.json(
                { success: false, error: "Camada não encontrada" },
                { status: 404 }
            );
        }

        if (!layer.tenantId && auth.user?.app_metadata?.is_superadmin !== true) {
            return NextResponse.json({ error: "Camada Global restrita ao Superadmin." }, { status: 403 });
        }

        // 4. Validar Input Básico
        if (!geojson || !properties) {
            return NextResponse.json(
                { success: false, error: "Dados inválidos: geojson e properties são obrigatórios" },
                { status: 400 }
            );
        }

        // 5. Inserir Dados
        await insertLayerData(layer.id, geojson, properties, layer.tenantId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Erro ao inserir dados na camada:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Erro interno" },
            { status: 500 }
        );
    }
}