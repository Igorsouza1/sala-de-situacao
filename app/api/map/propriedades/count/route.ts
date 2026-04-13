import { NextResponse, NextRequest } from "next/server";
import { countPropriedades } from "@/lib/repositories/propriedadesRepository";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const minArea = searchParams.get('minArea') ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea = searchParams.get('maxArea') ? parseFloat(searchParams.get('maxArea')!) : undefined;

        // tenantId will be injected here in task 2.4 via requireAuthWithTenant()
        const count = await countPropriedades(undefined, minArea, maxArea);
        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error counting propriedades:", error);
        return NextResponse.json({ error: "Failed to count" }, { status: 500 });
    }
}
