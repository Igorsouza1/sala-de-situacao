import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Resolve o regiaoId do usuário.
 * Prioridade: roles atuais → user_access somente sem roles → null
 */
export async function getRegionIdForUser(
  userId: string,
  tenantId: string,
): Promise<number | null> {
  // 1º: nova tabela roles (RBAC)
  const roleRow = await db.execute<{ region_id: number | null }>(sql`
    SELECT region_id
    FROM monitoramento.roles
    WHERE user_id  = ${userId}::uuid
      AND tenant_id = ${tenantId}::uuid
    ORDER BY region_id NULLS LAST, id ASC
    LIMIT 1
  `);
  if (roleRow.rows.length) return roleRow.rows[0].region_id;

  // 2º: tabela legada user_access
  const accessRow = await db.execute<{ regiao_id: number | null }>(sql`
    SELECT regiao_id
    FROM monitoramento.user_access
    WHERE user_id        = ${userId}::uuid
      AND organization_id = ${tenantId}::uuid
    LIMIT 1
  `);
  return accessRow.rows[0]?.regiao_id ?? null;
}

/**
 * Retorna todos os region_ids do usuário (para multi-região).
 * Prioridade: roles atuais → user_access somente sem roles.
 */
export async function getRegionIdsForUser(
  userId: string,
  tenantId: string,
): Promise<number[]> {
  const roleRows = await db.execute<{ region_id: number | null }>(sql`
    SELECT region_id
    FROM monitoramento.roles
    WHERE user_id  = ${userId}::uuid
      AND tenant_id = ${tenantId}::uuid
    ORDER BY id ASC
  `);
  if (roleRows.rows.length) return roleRows.rows
    .map((r) => r.region_id)
    .filter((id): id is number => id != null);

  const accessRow = await db.execute<{ regiao_id: number | null }>(sql`
    SELECT regiao_id
    FROM monitoramento.user_access
    WHERE user_id        = ${userId}::uuid
      AND organization_id = ${tenantId}::uuid
    LIMIT 1
  `);
  const id = accessRow.rows[0]?.regiao_id;
  return id != null ? [id] : [];
}

/** null means every region owned by the resolved tenant; [] means no access. */
export async function getAccessibleRegionIdsForUser(
  userId: string, tenantId: string, isSuperadmin = false,
): Promise<number[] | null> {
  if (isSuperadmin) return null;
  const owner = await db.execute<{ ok: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM monitoramento.roles
      WHERE user_id = ${userId}::uuid AND tenant_id = ${tenantId}::uuid
      AND role = 'owner') AS ok
  `);
  if (owner.rows[0]?.ok === true) return null;
  return getRegionIdsForUser(userId, tenantId);
}
