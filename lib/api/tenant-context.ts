import type { User } from "@supabase/supabase-js";

/**
 * Extrai o tenant_id do app_metadata do JWT Supabase.
 * Retorna null se o usuário não tiver tenant associado.
 */
export function extractTenantId(user: User): string | null {
  return user.app_metadata?.tenant_id ?? null;
}

/**
 * Extrai o tenant_id ou lança erro — para contextos onde tenant é obrigatório.
 */
export function requireTenantId(user: User): string {
  const tenantId = extractTenantId(user);
  if (!tenantId) throw new Error("User has no tenant association");
  return tenantId;
}
