import { NextRequest, NextResponse } from "next/server";
import { syncFirmsData } from "@/lib/service/firmsService";

export const dynamic = "force-dynamic";
export const maxDuration = 50; // 5 minutes for Pro plan, but optimizing for 10s on Hobby

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const result = await syncFirmsData();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Cron Sync Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
