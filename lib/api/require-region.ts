import { db } from '@/db';
import { sql } from 'drizzle-orm';

/**
 * Resolve o regiaoId do usuário a partir da tabela user_access.
 * Retorna null se o usuário não tiver região associada.
 */
export async function getRegionIdForUser(
  userId: string,
  tenantId: string,
): Promise<number | null> {
  const result = await db.execute<{ regiao_id: number | null }>(sql`
    SELECT regiao_id
    FROM monitoramento.user_access
    WHERE user_id = ${userId}::uuid
      AND organization_id = ${tenantId}::uuid
    LIMIT 1
  `);

  return result.rows[0]?.regiao_id ?? null;
}
