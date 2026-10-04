import { NextRequest, NextResponse } from "next/server";
import { findPropriedadeDossieData } from "@/lib/repositories/propriedadesRepository";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

    try {
        const { id } = await params;

        const parsedId = parseInt(id);
        if (isNaN(parsedId)) {
            return NextResponse.json(
                { success: false, error: "ID inválido" },
                { status: 400 }
            );
        }

        const regionIds = await getAccessibleRegionIdsForUser(user!.id, tenantId!, user!.app_metadata?.is_superadmin === true);
        if (regionIds?.length === 0) {
            return NextResponse.json({ success: false, error: "Propriedade não encontrada" }, { status: 404 });
        }
        const data = await findPropriedadeDossieData(parsedId, tenantId, regionIds ?? undefined);

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
