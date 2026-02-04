import { NextRequest, NextResponse } from "next/server";
import { processFirmsData } from "@/lib/service/firmsService";

export const dynamic = "force-dynamic"; // Ensure route isn't statically cached
export const maxDuration = 300; // Allow 5 minutes for processing (Vercel Pro/Hobby limits vary)

export async function GET(request: NextRequest) {
    // Validate Cron Secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const result = await processFirmsData();
        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
