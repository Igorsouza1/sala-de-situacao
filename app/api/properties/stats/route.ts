import { NextResponse } from "next/server";
import { getPropertiesSummary } from "@/services/properties-service";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const data = await getPropertiesSummary();

        return NextResponse.json({
            success: true,
            data: data
        });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { message: error.message } },
            { status: 500 }
        );
    }
}
