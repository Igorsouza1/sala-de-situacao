import { createClient } from "@/lib/supabase/server";
import { extractTenantId } from "@/lib/api/tenant-context";
import { FEATURES } from "@/lib/feature-flags";
import { db } from "@/db";
import { rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Verifica se o usuário autenticado tem role admin/owner no tenant atual.
 * Retorna boolean — uso exclusivo em Server Component layouts.
 * Para route handlers use `requireAdmin()` de lib/api/require-auth.ts.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const tenantId = FEATURES.MULTI_TENANT
    ? extractTenantId(user)
    : (process.env.SEED_TENANT_ID ?? null);

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
