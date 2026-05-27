import { createClient } from "@/lib/supabase/server";
import { extractTenantId } from "@/lib/api/tenant-context";
import { FEATURES } from "@/lib/feature-flags";
import { db } from "@/db";
import { rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

/**
 * Verifica se o usuário autenticado tem role admin/owner no tenant atual,
 * ou é superadmin global.
 * Retorna boolean — uso exclusivo em Server Component layouts.
 * Para route handlers use `requireAdmin()` de lib/api/require-auth.ts.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  // Superadmin global — bypassa qualquer verificação de tenant/role
  if (user.app_metadata?.is_superadmin === true) return true;

  let tenantId: string | null = null;

  if (!FEATURES.MULTI_TENANT) {
    tenantId = process.env.SEED_TENANT_ID ?? null;
  } else {
    // 1º JWT app_metadata
    tenantId = extractTenantId(user);
    // 2º user_access (usuários existentes sem JWT atualizado)
    if (!tenantId) {
      const row = await db.execute<{ organization_id: string }>(sql`
        SELECT organization_id FROM monitoramento.user_access
        WHERE user_id = ${user.id}::uuid LIMIT 1
      `);
      tenantId = row.rows[0]?.organization_id ?? null;
    }
    // 3º seed fallback
    if (!tenantId) tenantId = process.env.SEED_TENANT_ID ?? null;
  }

  if (!tenantId) return false;

  const match = await db
    .select({ id: rolesInMonitoramento.id })
    .from(rolesInMonitoramento)
    .where(and(
      eq(rolesInMonitoramento.userId, user.id),
      eq(rolesInMonitoramento.tenantId, tenantId),
      inArray(rolesInMonitoramento.role, ["owner", "admin"]),
    ))
    .limit(1);

  return match.length > 0;
}
