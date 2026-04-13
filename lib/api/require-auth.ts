import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { extractTenantId } from "@/lib/api/tenant-context";
import { FEATURES } from "@/lib/feature-flags";
import type { User } from "@supabase/supabase-js";

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
