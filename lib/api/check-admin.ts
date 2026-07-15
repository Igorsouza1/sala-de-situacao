import { createClient } from "@/lib/supabase/server";
import { resolveTenantIdForUser } from "@/lib/api/require-auth";
import { db } from "@/db";
import { rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Verifica se o usuário é Superadmin global (app_metadata.is_superadmin).
 * Uso exclusivo em Server Component layouts.
 */
export async function checkIsSuperadmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  return user.app_metadata?.is_superadmin === true;
}

/**
 * Verifica se o usuário é Superadmin ou Owner do tenant atual.
 * Uso exclusivo em Server Component layouts.
 * Para route handlers use `requireAdmin()` de lib/api/require-auth.ts.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  if (user.app_metadata?.is_superadmin === true) return true;

  const tenantId = await resolveTenantIdForUser(user);
  if (!tenantId) return false;

  const match = await db
    .select({ id: rolesInMonitoramento.id })
    .from(rolesInMonitoramento)
    .where(and(
      eq(rolesInMonitoramento.userId, user.id),
      eq(rolesInMonitoramento.tenantId, tenantId),
      inArray(rolesInMonitoramento.role, ["owner"]),
    ))
    .limit(1);

  return match.length > 0;
}
