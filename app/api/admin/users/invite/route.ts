import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api/responses";
import { db } from "@/db";
import { userAccessInMonitoramento, rolesInMonitoramento } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const { response: authResponse } = await requireAdmin();
  if (authResponse) return authResponse;

  const body = await request.json();
  const { email, tenantId, regiaoId, role = "viewer" } = body as {
    email: string;
    tenantId: string;
    regiaoId?: number;
    role?: string;
  };

  if (!email || !tenantId) {
    return apiError("email e tenantId são obrigatórios.", 400);
  }

  const validRoles = ["owner", "admin", "editor", "viewer", "auditor"];
  if (!validRoles.includes(role)) {
    return apiError("Role inválida.", 400);
  }

  // Verify tenant exists
  const tenantCheck = await db.execute(sql`
    SELECT id FROM monitoramento.tenants WHERE id = ${tenantId}::uuid LIMIT 1
  `);
  if (!tenantCheck.rows.length) {
    return apiError("Tenant não encontrado.", 404);
  }

  const supabaseAdmin = createAdminClient();

  // Invite user via Supabase admin
  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/invite`,
  });

  if (inviteError || !inviteData.user) {
    return apiError(inviteError?.message ?? "Erro ao enviar convite.", 500);
  }

  const userId = inviteData.user.id;

  // Set tenant_id in app_metadata so JWT includes it
  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { tenant_id: tenantId },
  });

  if (metaError) {
    return apiError(`Convite enviado mas falhou ao associar tenant: ${metaError.message}`, 500);
  }

  // Register in user_access for region resolution
  await db.insert(userAccessInMonitoramento).values({
    userId,
    organizationId: tenantId,
    regiaoId: regiaoId ?? null,
    role,
  }).onConflictDoNothing();

  // Register in roles table (RBAC)
  await db.insert(rolesInMonitoramento).values({
    userId,
    tenantId,
    role,
    regionId: regiaoId ?? null,
  }).onConflictDoNothing();

  return NextResponse.json({ success: true, userId });
}
