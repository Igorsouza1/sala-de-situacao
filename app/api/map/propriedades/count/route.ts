import { NextResponse, NextRequest } from "next/server";
import { countPropriedades } from "@/lib/repositories/propriedadesRepository";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const minArea = searchParams.get('minArea') ? parseFloat(searchParams.get('minArea')!) : undefined;
        const maxArea = searchParams.get('maxArea') ? parseFloat(searchParams.get('maxArea')!) : undefined;

        const count = await countPropriedades(minArea, maxArea);
        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error counting propriedades:", error);
        return NextResponse.json({ error: "Failed to count" }, { status: 500 });
    }
}
