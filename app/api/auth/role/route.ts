import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api/require-auth";

export async function GET() {
  const { response } = await requireRole("owner");
  return NextResponse.json({ isAdmin: response === null });
}
