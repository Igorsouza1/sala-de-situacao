import { db } from '@/db'
import { sql } from 'drizzle-orm'
// As Regiões para onde a pessoa pode ir (o item "Regiões" do menu da conta, DESIGN.md 13.11). As MESMAS regras do escopo das rotas
// (resolveScope, ADR 0010), para a lista nunca oferecer uma região que depois dá 403:
// - Superadmin: todas, de qualquer Organização;
// - dono (owner) de uma Organização: todas as dessa Organização;
// - os demais: as Regiões dos seus papéis.
// A pessoa pode ter papel em mais de uma Organização: a lista junta todas (abrir uma Região de outra Organização troca a
// Organização da pessoa, ver lib/api/open-region.ts).

export type RegionOption = {
  id: number
  nome: string
  municipio: string | null
  uf: string | null
  organizacao: string | null
}

export async function listAccessibleRegions(userId: string, isSuperadmin: boolean): Promise<RegionOption[]> {
  const cols = sql`r.id, COALESCE(r.nome, 'Região ' || r.id) AS nome,
    r.metadata->'identity'->>'municipio' AS municipio, r.metadata->'identity'->>'uf' AS uf, t.name AS organizacao`
  const from = sql`FROM monitoramento.regioes r LEFT JOIN monitoramento.tenants t ON t.id = r.organization_id`

  if (isSuperadmin) {
    return (await db.execute<RegionOption>(sql`SELECT ${cols} ${from} ORDER BY t.name NULLS LAST, r.nome, r.id`)).rows
  }

  return (
    await db.execute<RegionOption>(sql`
      SELECT ${cols} ${from}
      WHERE EXISTS (
        SELECT 1 FROM monitoramento.roles p
        WHERE p.user_id = ${userId}::uuid AND p.tenant_id = r.organization_id
          AND (p.role = 'owner' OR p.region_id = r.id)
      )
      ORDER BY t.name NULLS LAST, r.nome, r.id
    `)
  ).rows
}
