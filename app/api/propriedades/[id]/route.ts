
import { updatePropriedadeName } from "@/lib/repositories/propriedadesRepository";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

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

        const updated = await updatePropriedadeName(parseInt(id), nome, tenantId)

        return NextResponse.json({ success: true, data: updated })
    } catch (error: any) {
        console.error("Erro ao atualizar propriedade:", error)
        return NextResponse.json({ success: false, error: "Erro interno ao atualizar" }, { status: 500 })
    }
}
