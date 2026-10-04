import { resolveScope } from "@/lib/api/scope";
import { NextResponse } from "next/server";
import { findAllLayersCatalog } from "@/lib/repositories/layerRepository";

export const dynamic = 'force-dynamic';

export async function GET() {
    const scope = await resolveScope();
    if (scope.response) return scope.response;
    try {
        const layers = await findAllLayersCatalog(scope.tenantId);
        return NextResponse.json(layers);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Erro ao buscar camadas" },
            { status: 500 }
        );
    }
}
