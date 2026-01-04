
import { updatePropriedadeName } from "@/lib/repositories/propriedadesRepository";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { nome } = body

        if (!id) {
            return NextResponse.json({ success: false, error: "ID não fornecido" }, { status: 400 })
        }

        if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
            return NextResponse.json({ success: false, error: "Nome inválido" }, { status: 400 })
        }

        // Call Repository
        const updated = await updatePropriedadeName(parseInt(id), nome)

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        console.error("Erro ao atualizar propriedade:", error)
        return NextResponse.json({ success: false, error: "Erro interno ao atualizar" }, { status: 500 })
    }
}
