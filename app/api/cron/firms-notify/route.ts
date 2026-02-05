import { NextRequest, NextResponse } from "next/server";
import { notifyFirms } from "@/lib/service/firmsService";

export const dynamic = "force-dynamic";
export const maxDuration = 50;

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const result = await notifyFirms();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Cron Notify Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
