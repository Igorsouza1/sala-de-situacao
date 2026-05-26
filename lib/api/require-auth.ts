import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { extractTenantId } from "@/lib/api/tenant-context";
import { FEATURES } from "@/lib/feature-flags";
import type { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

interface AuthResult {
  user: User | null;
  response: Response | null;
}

interface AuthWithTenantResult {
  user: User | null;
  tenantId: string | null;
  response: Response | null;
}

/**
 * Verifica se a requisição possui sessão ativa no Supabase.
 *
 * Uso em route handlers:
 * ```ts
 * const { user, response } = await requireAuth();
 * if (response) return response; // 401
 * // user está disponível aqui
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: apiError("Não autorizado.", 401),
    };
  }

  return { user, response: null };
}

/**
 * Verifica autenticação e resolve o tenantId do contexto atual.
 *
 * - MULTI_TENANT=false → usa SEED_TENANT_ID do env (rollback seguro)
 * - MULTI_TENANT=true  → extrai tenant_id do JWT; retorna 403 se ausente
 *
 * Uso em route handlers:
 * ```ts
 * const { user, tenantId, response } = await requireAuthWithTenant();
 * if (response) return response; // 401 ou 403
 * ```
 */
export async function requireAuthWithTenant(): Promise<AuthWithTenantResult> {
  const { user, response } = await requireAuth();
  if (response || !user) return { user: null, tenantId: null, response };

  if (!FEATURES.MULTI_TENANT) {
    const seedTenantId = process.env.SEED_TENANT_ID ?? null;
    return { user, tenantId: seedTenantId, response: null };
  }

  const tenantId = extractTenantId(user);
  if (!tenantId) {
    return {
      user,
      tenantId: null,
      response: apiError("Usuário sem tenant associado.", 403),
    };
  }

  return { user, tenantId, response: null };
}

/**
 * Verifica autenticação, resolve tenant e confere se o usuário tem role admin/owner
 * em `monitoramento.roles`. Retorna 403 se não tiver permissão.
 */
export async function requireAdmin(): Promise<AuthWithTenantResult> {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response || !user || !tenantId) {
    return { user: null, tenantId: null, response: response ?? apiError("Não autorizado.", 401) };
  }

  const adminRole = await db
    .select({ id: rolesInMonitoramento.id })
    .from(rolesInMonitoramento)
    .where(and(
      eq(rolesInMonitoramento.userId, user.id),
      eq(rolesInMonitoramento.tenantId, tenantId),
      inArray(rolesInMonitoramento.role, ["owner", "admin"]),
    ))
    .limit(1);

  if (!adminRole.length) {
    return { user, tenantId, response: apiError("Acesso negado. Role insuficiente.", 403) };
  }

  return { user, tenantId, response: null };
}
