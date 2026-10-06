import { db } from '@/db'
import { sql } from 'drizzle-orm'
import type { NovidadesQuery } from '@/lib/validations/map-novidades'
import type { Novidades } from '@/types/map-novidades'

// Quantos ids voltam por fonte: o suficiente para o mapa destacar o que mudou sem devolver milhares de linhas.
const ID_LIMIT = 500

export async function queryNovidades(tenantId: string, regiaoId: number, query: NovidadesQuery): Promise<Novidades> {
  // a hora é a do banco, a mesma das colunas created_at: comparar com a hora do aparelho erraria por fuso e por relógio desajustado
  const clock = await db.execute<{ now: string }>(sql`SELECT now() AS now`)
  const now = new Date(clock.rows[0].now).toISOString()

  // ações: o escopo é a organização e a interseção com a região (como na consulta); novas = id maior que o último visto
  const inRegion = sql`a.tenant_id = ${tenantId}::uuid AND EXISTS (
    SELECT 1 FROM monitoramento.regioes r
    WHERE r.id = ${regiaoId} AND r.organization_id = ${tenantId}::uuid AND ST_Intersects(a.geom, r.geom))`
  const max = await db.execute<{ max_id: number }>(sql`SELECT COALESCE(MAX(a.id), 0)::int AS max_id FROM monitoramento.acoes a WHERE ${inRegion}`)
  const acoesMaxId = max.rows[0].max_id

  const empty = { count: 0, ids: [] as string[] }
  // primeira visita (sem ponto de partida): só devolve de onde partir. Nada é "novo" para quem nunca viu nada.
  if (query.since === undefined || query.acoes_after === undefined) {
    return { now, acoesMaxId, focos: empty, desmatamento: empty, acoes: empty }
  }

  // focos e desmatamento: o vínculo com a região é a junction, e o created_at dela é quando o foco ou o alerta passou a valer para ela
  const junction = async (table: 'firms_regioes' | 'desmatamento_regioes', fk: 'firm_id' | 'desmatamento_id') => {
    const rows = await db.execute<{ id: string; total: number }>(sql`
      SELECT ${sql.identifier(fk)}::text AS id, COUNT(*) OVER ()::int AS total
      FROM monitoramento.${sql.identifier(table)}
      WHERE regiao_id = ${regiaoId} AND created_at > ${query.since}::timestamptz
      ORDER BY created_at DESC
      LIMIT ${ID_LIMIT}`)
    return { count: rows.rows[0]?.total ?? 0, ids: rows.rows.map((r) => r.id) }
  }
  const [focos, desmatamento] = await Promise.all([junction('firms_regioes', 'firm_id'), junction('desmatamento_regioes', 'desmatamento_id')])

  const novas = await db.execute<{ id: string; total: number }>(sql`
    SELECT a.id::text AS id, COUNT(*) OVER ()::int AS total
    FROM monitoramento.acoes a
    WHERE ${inRegion} AND a.id > ${query.acoes_after}
    ORDER BY a.id DESC
    LIMIT ${ID_LIMIT}`)
  const acoes = { count: novas.rows[0]?.total ?? 0, ids: novas.rows.map((r) => r.id) }

  return { now, acoesMaxId, focos, desmatamento, acoes }
}
