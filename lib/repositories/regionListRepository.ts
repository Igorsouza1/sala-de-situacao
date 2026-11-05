import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { getAccessibleRegionIdsForUser } from '@/lib/api/require-region'

// As Regiões para onde a pessoa pode ir (o item "Regiões" do menu da conta, DESIGN.md 13.11). As MESMAS regras do escopo das rotas
// (resolveScope, ADR 0010), para a lista nunca oferecer uma região que depois dá 403:
// - Superadmin: todas, de qualquer Organização;
// - dono (owner) da Organização: todas as da Organização;
// - os demais: só as Regiões dos seus papéis, dentro da Organização.

export type RegionOption = {
  id: number
  nome: string
  municipio: string | null
  uf: string | null
  organizacao: string | null
}

export async function listAccessibleRegions(userId: string, tenantId: string, isSuperadmin: boolean): Promise<RegionOption[]> {
  const cols = sql`r.id, COALESCE(r.nome, 'Região ' || r.id) AS nome,
    r.metadata->'identity'->>'municipio' AS municipio, r.metadata->'identity'->>'uf' AS uf, t.name AS organizacao`
  const from = sql`FROM monitoramento.regioes r LEFT JOIN monitoramento.tenants t ON t.id = r.organization_id`

  if (isSuperadmin) {
    return (await db.execute<RegionOption>(sql`SELECT ${cols} ${from} ORDER BY t.name NULLS LAST, r.nome, r.id`)).rows
  }

  const allowed = await getAccessibleRegionIdsForUser(userId, tenantId, false)
  if (allowed !== null && allowed.length === 0) return []
  const onlyAllowed = allowed === null ? sql`` : sql`AND r.id IN (${sql.join(allowed.map((id) => sql`${id}`), sql`, `)})`
  return (
    await db.execute<RegionOption>(sql`
      SELECT ${cols} ${from}
      WHERE r.organization_id = ${tenantId}::uuid ${onlyAllowed}
      ORDER BY r.nome, r.id
    `)
  ).rows
}
