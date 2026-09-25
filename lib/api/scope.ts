import type { User } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/responses";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getRegionIdForUser } from "@/lib/api/require-region";
import { getTenantIdForRegion } from "@/lib/api/region-tenant";

export { getTenantIdForRegion };

export type ScopeResult =
  | { user: User; tenantId: string; regiaoId: number | null; response: null }
  | { user: null; tenantId: null; regiaoId: null; response: Response };

/**
 * Resolução única de escopo de uma requisição (ADR 0010): autentica, resolve o
 * tenant do usuário e a Região efetiva.
 *
 * - Com `regiaoId` explícito: o tenant efetivo é o da Organização dona da
 *   Região. Se a Região pertence a outra Organização, só Superadmin passa —
 *   usuário comum recebe 403 (isolamento de tenant).
 * - Sem `regiaoId`: usa a Região associada ao usuário (roles → user_access).
 */
export async function resolveScope(
  opts: { regiaoId?: number | null } = {},
): Promise<ScopeResult> {
  const denied = (response: Response): ScopeResult =>
    ({ user: null, tenantId: null, regiaoId: null, response });

  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response || !user || !tenantId) {
    return denied(response ?? apiError("Não autorizado.", 401));
  }

  if (opts.regiaoId != null) {
    const regionTenant = await getTenantIdForRegion(opts.regiaoId);
    if (!regionTenant) {
      return denied(apiError(`Região ${opts.regiaoId} não possui Organização associada.`, 400));
    }
    if (regionTenant !== tenantId && user.app_metadata?.is_superadmin !== true) {
      return denied(apiError("Região pertence a outra Organização.", 403));
    }
    return { user, tenantId: regionTenant, regiaoId: opts.regiaoId, response: null };
  }

  const regiaoId = await getRegionIdForUser(user.id, tenantId);
  return { user, tenantId, regiaoId, response: null };
}

/** Extrai e valida o query param `regiao_id` de uma URL. */
export function parseRegiaoIdParam(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get("regiao_id");
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}
