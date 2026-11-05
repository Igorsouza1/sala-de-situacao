import { db } from '@/db'
import { sql } from 'drizzle-orm'

// O resumo das Ações (DESIGN.md 13.13): TODAS as ações da região, sem os filtros do mapa, contadas por grupo. Volta só o que as regras
// de cor e ícone do catálogo leem (situação, caráter, área) e o ano: a tela classifica cada grupo pelas mesmas regras do pino.
// O escopo é o mesmo da consulta e das novidades: a organização e a interseção com a região.

export type AcoesResumoGroup = {
  status: string | null
  carater: string | null
  eixo_tematico: string | null
  ano: number | null
  count: number
}

export async function queryAcoesResumo(tenantId: string, regiaoId: number): Promise<AcoesResumoGroup[]> {
  const rows = await db.execute<AcoesResumoGroup>(sql`
    SELECT a.status::text AS status, a.carater, a.eixo_tematico,
           EXTRACT(YEAR FROM a.time)::int AS ano, COUNT(*)::int AS count
    FROM monitoramento.acoes a
    WHERE a.tenant_id = ${tenantId}::uuid AND EXISTS (
      SELECT 1 FROM monitoramento.regioes r
      WHERE r.id = ${regiaoId} AND r.organization_id = ${tenantId}::uuid AND ST_Intersects(a.geom, r.geom))
    GROUP BY 1, 2, 3, 4
  `)
  return rows.rows
}
