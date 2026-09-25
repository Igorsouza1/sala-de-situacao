import { db } from "@/db";
import { sql } from "drizzle-orm";

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
