import { NextRequest, NextResponse } from "next/server";
import { findPropriedadeDossieData } from "@/lib/repositories/propriedadesRepository";

export async function GET(
    request: NextRequest,
    // 1. Update the type definition here to Promise
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 2. You are already correctly awaiting it here, which is great!
        const { id } = await params;

        const parsedId = parseInt(id);
        if (isNaN(parsedId)) {
            return NextResponse.json(
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        const data = await findPropriedadeDossieData(parsedId);

        if (!data) {
            return NextResponse.json(
                { success: false, error: "Propriedade não encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Erro CRITICO ao buscar dossiê da propriedade [SECURITY]:", error);
        return NextResponse.json(
            { success: false, error: "Erro interno ao processar a requisição." },
            { status: 500 }
        );
    }
}