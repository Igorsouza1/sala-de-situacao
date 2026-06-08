import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { extractTenantId } from "@/lib/api/tenant-context";
import type { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

interface AuthResult {
  user: User | null;
  response: Response | null;
}

interface AuthWithTenantResult {
  user: User | null;
  tenantId: string | null;
  response: Response | null;
}

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, response: apiError("Não autorizado.", 401) };
  }

  return { user, response: null };
}

export async function requireAuthWithTenant(): Promise<AuthWithTenantResult> {
  const { user, response } = await requireAuth();
  if (response || !user) return { user: null, tenantId: null, response };

  // 1st: JWT app_metadata
  let tenantId = extractTenantId(user);

  // 2nd: user_access table (fallback for existing users not yet re-invited)
  if (!tenantId) {
    const row = await db.execute<{ organization_id: string }>(sql`
      SELECT organization_id
      FROM monitoramento.user_access
      WHERE user_id = ${user.id}::uuid
      LIMIT 1
    `);
    tenantId = row.rows[0]?.organization_id ?? null;
  }

  // 3rd: seed fallback (dev / single-tenant mode)
  if (!tenantId) {
    tenantId = process.env.SEED_TENANT_ID ?? null;
  }

  // 4th: superadmin sem tenant explícito → usa primeiro tenant disponível
  if (!tenantId && user.app_metadata?.is_superadmin === true) {
    const firstTenant = await db.execute<{ id: string }>(sql`
      SELECT id FROM monitoramento.tenants ORDER BY created_at ASC LIMIT 1
    `);
    tenantId = firstTenant.rows[0]?.id ?? null;
  }

  if (!tenantId) {
    return { user, tenantId: null, response: apiError("Usuário sem tenant associado.", 403) };
  }

  return { user, tenantId, response: null };
}

export async function requireAdmin(): Promise<AuthWithTenantResult> {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response || !user || !tenantId) {
    return { user: null, tenantId: null, response: response ?? apiError("Não autorizado.", 401) };
  }

  if (user.app_metadata?.is_superadmin === true) {
    return { user, tenantId, response: null };
  }

  const adminRole = await db
    .select({ id: rolesInMonitoramento.id })
    .from(rolesInMonitoramento)
    .where(and(
      eq(rolesInMonitoramento.userId, user.id),
      eq(rolesInMonitoramento.tenantId, tenantId),
      inArray(rolesInMonitoramento.role, ["owner"]),
    ))
    .limit(1);

  if (!adminRole.length) {
    return { user, tenantId, response: apiError("Acesso negado. Role insuficiente.", 403) };
  }

  return { user, tenantId, response: null };
}
