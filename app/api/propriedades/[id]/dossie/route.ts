import { NextRequest, NextResponse } from "next/server";
import { findPropriedadeDossieData } from "@/lib/repositories/propriedadesRepository";


export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params
        const parsedId = parseInt(id)
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
        // SECURITY: Log detailed error on server but return generic message to client to avoid leaking DB schema
        console.error("Erro CRITICO ao buscar dossiê da propriedade [SECURITY]:", error);
        return NextResponse.json(
            { success: false, error: "Erro interno ao processar a requisição." },
            { status: 500 }
        );
    }
}
