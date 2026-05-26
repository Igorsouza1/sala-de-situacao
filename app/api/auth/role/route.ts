import { NextResponse } from "next/server";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { db } from "@/db";
import { rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function GET() {
  const { user, tenantId } = await requireAuthWithTenant();

  if (!user || !tenantId) {
    return NextResponse.json({ isAdmin: false });
  }

  const match = await db
    .select({ id: rolesInMonitoramento.id })
    .from(rolesInMonitoramento)
    .where(and(
      eq(rolesInMonitoramento.userId, user.id),
      eq(rolesInMonitoramento.tenantId, tenantId),
      inArray(rolesInMonitoramento.role, ["owner", "admin"]),
    ))
    .limit(1);

  return NextResponse.json({ isAdmin: match.length > 0 });
}
