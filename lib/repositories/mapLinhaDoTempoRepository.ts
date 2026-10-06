import { db } from '@/db'
import { sql } from 'drizzle-orm'
import type { LinhaDoTempo, MesContagem } from '@/types/map-linha-do-tempo'

// A linha do tempo de uma região (DESIGN.md 13.9): quantos focos, alertas de desmatamento e ações por mês.
// Focos e desmatamento: o vínculo com a região é a junction (a região já foi autorizada pelo escopo). Ações: a organização e a
// interseção com a região, como na consulta. O desmatamento guarda a data como TEXTO com formatos misturados ("2024-11-01" e
// "2024-11-01 00:00:00"): lê-se só o "AAAA-MM" do começo, e o que não tem esse começo é ignorado em vez de quebrar a consulta.

type Linha = Record<string, unknown> & MesContagem
const rows = (result: { rows: Linha[] }): MesContagem[] => result.rows.map((r) => ({ mes: r.mes, n: Number(r.n) }))

export async function queryLinhaDoTempo(tenantId: string, regiaoId: number): Promise<LinhaDoTempo> {
  const [focos, desmatamento, acoes] = await Promise.all([
    db.execute<Linha>(sql`
      SELECT to_char(date_trunc('month', f.acq_date), 'YYYY-MM') AS mes, COUNT(*)::int AS n
      FROM monitoramento.raw_firms f
      JOIN monitoramento.firms_regioes fr ON fr.firm_id = f.id
      WHERE fr.regiao_id = ${regiaoId} AND f.acq_date IS NOT NULL
      GROUP BY 1 ORDER BY 1`),
    db.execute<Linha>(sql`
      SELECT left(d.detectat, 7) AS mes, COUNT(*)::int AS n
      FROM monitoramento.desmatamento d
      JOIN monitoramento.desmatamento_regioes dr ON dr.desmatamento_id = d.id
      WHERE dr.regiao_id = ${regiaoId} AND d.detectat ~ '^[0-9]{4}-(0[1-9]|1[0-2])'
      GROUP BY 1 ORDER BY 1`),
    db.execute<Linha>(sql`
      SELECT to_char(date_trunc('month', a.time), 'YYYY-MM') AS mes, COUNT(*)::int AS n
      FROM monitoramento.acoes a
      WHERE a.time IS NOT NULL AND a.tenant_id = ${tenantId}::uuid AND EXISTS (
        SELECT 1 FROM monitoramento.regioes r
        WHERE r.id = ${regiaoId} AND r.organization_id = ${tenantId}::uuid AND ST_Intersects(a.geom, r.geom))
      GROUP BY 1 ORDER BY 1`),
  ])
  return { focos: rows(focos), desmatamento: rows(desmatamento), acoes: rows(acoes) }
}
