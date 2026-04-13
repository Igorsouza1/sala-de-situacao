import { NextResponse, NextRequest } from "next/server";
import { countPropriedades } from "@/lib/repositories/propriedadesRepository";
import { requireAuthWithTenant } from "@/lib/api/require-auth";

export async function GET(request: NextRequest) {
    const { tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

    try {
        const searchParams = request.nextUrl.searchParams;
        const minArea = searchParams.get('minArea') ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea = searchParams.get('maxArea') ? parseFloat(searchParams.get('maxArea')!) : undefined;

        const count = await countPropriedades(tenantId, minArea, maxArea);
        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error counting propriedades:", error);
        return NextResponse.json({ error: "Failed to count" }, { status: 500 });
    }
}
