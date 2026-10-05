import type { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiError } from "@/lib/api/responses";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";

/**
 * Resolve a Organização dona de uma Região.
 * Fonte canônica: coluna `regioes.organization_id` (o `metadata->>'organizationId'`
 * é legado e está sendo removido — ver docs/decisoes-produto.md).
 */
export async function getTenantIdForRegion(regiaoId: number): Promise<string | null> {
  const row = await db.execute<{ tenant_id: string | null }>(sql`
    SELECT organization_id::text AS tenant_id
    FROM monitoramento.regioes
    WHERE id = ${regiaoId}
  `);
  return row.rows[0]?.tenant_id ?? null;
}

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
 * - Sem `regiaoId`: usa a Região associada ao usuário em roles.
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
    if (!Number.isSafeInteger(opts.regiaoId) || opts.regiaoId <= 0) {
      return denied(apiError("ID de região inválido.", 400));
    }
    const regionTenant = await getTenantIdForRegion(opts.regiaoId);
    if (!regionTenant) {
      return denied(apiError(`Região ${opts.regiaoId} não possui Organização associada.`, 400));
    }
    if (regionTenant !== tenantId && user.app_metadata?.is_superadmin !== true) {
      return denied(apiError("Região pertence a outra Organização.", 403));
    }
    const allowed = await getAccessibleRegionIdsForUser(user.id, regionTenant, user.app_metadata?.is_superadmin === true);
    if (allowed !== null && !allowed.includes(opts.regiaoId)) {
      return denied(apiError("Região não acessível.", 403));
    }
    return { user, tenantId: regionTenant, regiaoId: opts.regiaoId, response: null };
  }

  const allowed = await getAccessibleRegionIdsForUser(user.id, tenantId, user.app_metadata?.is_superadmin === true);
  if (allowed?.length === 0) return denied(apiError("Região não acessível.", 403));
  const regiaoId = allowed === null ? null : allowed[0];
  return { user, tenantId, regiaoId, response: null };
}
