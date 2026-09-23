import { db } from "@/db";
import { regioesInMonitoramento, rolesInMonitoramento } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export interface UserAccessRow {
  roleId: number;
  userId: string;
  email: string | null;
  role: string;
  tenantId: string;
  organizationName: string;
  regionId: number | null;
  regionName: string | null;
  createdAt: string;
  invitedAt: string | null;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
}

/** Lista todas as atribuições (organização + região + papel) de todos os usuários. */
export async function listUserAccessInDb(): Promise<UserAccessRow[]> {
  const result = await db.execute(sql<UserAccessRow>`
    SELECT
      r.id AS "roleId",
      r.user_id::text AS "userId",
      u.email AS "email",
      r.role,
      r.tenant_id::text AS "tenantId",
      t.name AS "organizationName",
      r.region_id AS "regionId",
      g.nome AS "regionName",
      r.created_at AS "createdAt",
      u.invited_at AS "invitedAt",
      u.email_confirmed_at AS "emailConfirmedAt",
      u.last_sign_in_at AS "lastSignInAt"
    FROM monitoramento.roles r
    JOIN monitoramento.tenants t ON t.id = r.tenant_id
    LEFT JOIN monitoramento.regioes g ON g.id = r.region_id
    LEFT JOIN auth.users u ON u.id = r.user_id
    ORDER BY t.name ASC, u.email ASC NULLS LAST, g.nome ASC NULLS FIRST
  `);

  return result.rows as unknown as UserAccessRow[];
}

export async function getRoleAssignmentByIdInDb(roleId: number): Promise<UserAccessRow | null> {
  const result = await db.execute(sql<UserAccessRow>`
    SELECT
      r.id AS "roleId",
      r.user_id::text AS "userId",
      u.email AS "email",
      r.role,
      r.tenant_id::text AS "tenantId",
      t.name AS "organizationName",
      r.region_id AS "regionId",
      g.nome AS "regionName",
      r.created_at AS "createdAt",
      u.invited_at AS "invitedAt",
      u.email_confirmed_at AS "emailConfirmedAt",
      u.last_sign_in_at AS "lastSignInAt"
    FROM monitoramento.roles r
    JOIN monitoramento.tenants t ON t.id = r.tenant_id
    LEFT JOIN monitoramento.regioes g ON g.id = r.region_id
    LEFT JOIN auth.users u ON u.id = r.user_id
    WHERE r.id = ${roleId}
  `);

  return (result.rows[0] as unknown as UserAccessRow) ?? null;
}

export interface AuthUserLookup {
  id: string;
  email: string;
  emailConfirmedAt: string | null;
}

/** Busca um usuário Supabase já existente pelo email (case-insensitive). */
export async function findAuthUserByEmailInDb(email: string): Promise<AuthUserLookup | null> {
  const result = await db.execute(sql<AuthUserLookup>`
    SELECT id::text AS "id", email, email_confirmed_at AS "emailConfirmedAt"
    FROM auth.users
    WHERE lower(email) = lower(${email})
    LIMIT 1
  `);
  return (result.rows[0] as unknown as AuthUserLookup) ?? null;
}

/**
 * Insere uma atribuição de papel por região selecionada (ou uma única linha
 * com region_id null para "acesso à organização toda"). Duplicatas
 * (mesmo tenant+usuário+região) são ignoradas silenciosamente — o chamador
 * compara input vs retorno para saber o que foi de fato criado.
 */
export async function insertRoleAssignmentsInDb(input: {
  tenantId: string;
  userId: string;
  role: string;
  regionIds: number[]; // vazio => uma linha com regionId null
}): Promise<{ id: number; regionId: number | null }[]> {
  const rows = input.regionIds.length > 0
    ? input.regionIds.map((regionId) => ({
        tenantId: input.tenantId,
        userId: input.userId,
        role: input.role,
        regionId,
      }))
    : [{ tenantId: input.tenantId, userId: input.userId, role: input.role, regionId: null }];

  const inserted = await db
    .insert(rolesInMonitoramento)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: rolesInMonitoramento.id, regionId: rolesInMonitoramento.regionId });

  return inserted;
}

/** Compat legado: garante 1 linha em user_access para resolução de tenantId via JWT ausente. */
export async function ensureLegacyUserAccessInDb(input: {
  userId: string;
  tenantId: string;
  regionId: number | null;
}): Promise<void> {
  await db.execute(sql`
    INSERT INTO monitoramento.user_access (user_id, organization_id, regiao_id, role)
    SELECT ${input.userId}::uuid, ${input.tenantId}::uuid, ${input.regionId}, 'viewer'
    WHERE NOT EXISTS (
      SELECT 1 FROM monitoramento.user_access
      WHERE user_id = ${input.userId}::uuid AND organization_id = ${input.tenantId}::uuid
    )
  `);
}

export async function updateRoleAssignmentInDb(
  roleId: number,
  input: { role: string; regionId: number | null },
) {
  const [updated] = await db
    .update(rolesInMonitoramento)
    .set({ role: input.role, regionId: input.regionId })
    .where(eq(rolesInMonitoramento.id, roleId))
    .returning({ id: rolesInMonitoramento.id });

  return updated ?? null;
}

export async function deleteRoleAssignmentInDb(roleId: number) {
  const [deleted] = await db
    .delete(rolesInMonitoramento)
    .where(eq(rolesInMonitoramento.id, roleId))
    .returning({ id: rolesInMonitoramento.id });

  return deleted ?? null;
}

/** Remove TODAS as atribuições (todas as orgs/regiões) de um usuário. Retorna quantas linhas foram removidas. */
export async function deleteAllRoleAssignmentsForUserInDb(userId: string): Promise<number> {
  const deleted = await db
    .delete(rolesInMonitoramento)
    .where(eq(rolesInMonitoramento.userId, userId))
    .returning({ id: rolesInMonitoramento.id });
  return deleted.length;
}

/** Compat legado: remove todas as linhas de user_access de um usuário. */
export async function deleteAllLegacyUserAccessInDb(userId: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM monitoramento.user_access WHERE user_id = ${userId}::uuid
  `);
}

export async function tenantExistsInDb(tenantId: string): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT id FROM monitoramento.tenants WHERE id = ${tenantId}::uuid LIMIT 1
  `);
  return result.rows.length > 0;
}

export async function regionsBelongToTenantInDb(tenantId: string, regionIds: number[]): Promise<boolean> {
  if (regionIds.length === 0) return true;
  const rows = await db
    .select({ id: regioesInMonitoramento.id })
    .from(regioesInMonitoramento)
    .where(and(
      eq(regioesInMonitoramento.organizationId, tenantId),
      inArray(regioesInMonitoramento.id, regionIds),
    ));
  return rows.length === regionIds.length;
}

export async function getTenantNameInDb(tenantId: string): Promise<string | null> {
  const result = await db.execute<{ name: string }>(sql`
    SELECT name FROM monitoramento.tenants WHERE id = ${tenantId}::uuid LIMIT 1
  `);
  return result.rows[0]?.name ?? null;
}

export async function getRegionNamesInDb(regionIds: number[]): Promise<string[]> {
  if (regionIds.length === 0) return [];
  const rows = await db
    .select({ nome: regioesInMonitoramento.nome })
    .from(regioesInMonitoramento)
    .where(inArray(regioesInMonitoramento.id, regionIds))
    .orderBy(regioesInMonitoramento.nome);
  return rows.map((r) => r.nome);
}
