import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import { extractTenantId } from "@/lib/api/tenant-context";
import { readActiveRegionId } from "@/lib/api/active-region-server";
import { getTenantIdForRegion } from "@/lib/api/region-tenant";
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

/**
 * Resolve o tenant de um usuário sem exigir contexto de request (ADR 0010).
 * Cadeia: JWT app_metadata → roles (primária) → user_access (legada) →
 * superadmin sem tenant explícito usa o primeiro tenant. Sem fallback SEED:
 * usuário sem tenant resolvível retorna null (a rota responde 403).
 */
export async function resolveTenantIdForUser(user: User): Promise<string | null> {
  // 1º: JWT app_metadata
  let tenantId = extractTenantId(user);

  // 2º: tabela roles (RBAC — fonte primária)
  if (!tenantId) {
    const row = await db.execute<{ tenant_id: string }>(sql`
      SELECT tenant_id::text AS tenant_id
      FROM monitoramento.roles
      WHERE user_id = ${user.id}::uuid
      ORDER BY id ASC
      LIMIT 1
    `);
    tenantId = row.rows[0]?.tenant_id ?? null;
  }

  // 3º: tabela legada user_access (usuários ainda não re-convidados)
  if (!tenantId) {
    const row = await db.execute<{ organization_id: string }>(sql`
      SELECT organization_id
      FROM monitoramento.user_access
      WHERE user_id = ${user.id}::uuid
      LIMIT 1
    `);
    tenantId = row.rows[0]?.organization_id ?? null;
  }

  // 4º: superadmin sem tenant explícito → usa primeiro tenant disponível
  if (!tenantId && user.app_metadata?.is_superadmin === true) {
    const firstTenant = await db.execute<{ id: string }>(sql`
      SELECT id FROM monitoramento.tenants ORDER BY created_at ASC LIMIT 1
    `);
    tenantId = firstTenant.rows[0]?.id ?? null;
  }

  return tenantId;
}

/**
 * Superadmin não tem tenant fixo: o tenant efetivo é o da Região que ele está
 * visualizando (cookie de Região ativa, mantido pelo middleware). Sem Região
 * ativa — ou com uma Região sem Organização — cai na cadeia padrão.
 */
async function resolveSuperadminTenantId(user: User): Promise<string | null> {
  const activeRegionId = await readActiveRegionId();
  const activeRegionTenant = activeRegionId != null ? await getTenantIdForRegion(activeRegionId) : null;
  return activeRegionTenant ?? resolveTenantIdForUser(user);
}

export async function requireAuthWithTenant(): Promise<AuthWithTenantResult> {
  const { user, response } = await requireAuth();
  if (response || !user) return { user: null, tenantId: null, response };

  const tenantId = user.app_metadata?.is_superadmin === true
    ? await resolveSuperadminTenantId(user)
    : await resolveTenantIdForUser(user);

  if (!tenantId) {
    return { user, tenantId: null, response: apiError("Usuário sem tenant associado.", 403) };
  }

  return { user, tenantId, response: null };
}

/**
 * Exige Superadmin global (app_metadata.is_superadmin). Uso em route handlers
 * que operam entre múltiplos tenants (ex: gerenciador de usuários em /admin).
 * Para checagem em Server Component layouts use `checkIsSuperadmin()`.
 */
export async function requireSuperadmin(): Promise<AuthResult> {
  const { user, response } = await requireAuth();
  if (response || !user) return { user: null, response };

  if (user.app_metadata?.is_superadmin !== true) {
    return { user: null, response: apiError("Acesso restrito a superadministradores.", 403) };
  }

  return { user, response: null };
}

export type AppRole = "superadmin" | "owner" | "editor" | "auditor" | "viewer";

// Hierarquia do ADR 0003. Auditor e Viewer têm o mesmo nível de leitura;
// o que os distingue (acesso a logs) é checado pontualmente, não aqui.
const ROLE_LEVEL: Record<Exclude<AppRole, "superadmin">, number> = {
  owner: 3,
  editor: 2,
  auditor: 1,
  viewer: 1,
};

/**
 * Guarda única de autorização por papel (ADR 0003 / ADR 0005).
 *
 * - `requireRole("superadmin")`: só passa Superadmin global — nenhum papel de
 *   tenant é suficiente. Use nas rotas de Importação e gestão de Regiões.
 * - Demais papéis: Superadmin sempre passa; senão exige papel do usuário no
 *   tenant com nível >= ao mínimo pedido.
 */
export async function requireRole(minRole: AppRole): Promise<AuthWithTenantResult> {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response || !user || !tenantId) {
    return { user: null, tenantId: null, response: response ?? apiError("Não autorizado.", 401) };
  }

  if (user.app_metadata?.is_superadmin === true) {
    return { user, tenantId, response: null };
  }

  if (minRole === "superadmin") {
    return { user, tenantId, response: apiError("Acesso restrito ao Superadmin.", 403) };
  }

  const allowed = (Object.keys(ROLE_LEVEL) as Array<keyof typeof ROLE_LEVEL>)
    .filter((role) => ROLE_LEVEL[role] >= ROLE_LEVEL[minRole]);

  const match = await db
    .select({ id: rolesInMonitoramento.id })
    .from(rolesInMonitoramento)
    .where(and(
      eq(rolesInMonitoramento.userId, user.id),
      eq(rolesInMonitoramento.tenantId, tenantId),
      inArray(rolesInMonitoramento.role, allowed),
    ))
    .limit(1);

  if (!match.length) {
    return { user, tenantId, response: apiError("Acesso negado. Role insuficiente.", 403) };
  }

  return { user, tenantId, response: null };
}

export async function requireAdmin(): Promise<AuthWithTenantResult> {
  return requireRole("owner");
}
