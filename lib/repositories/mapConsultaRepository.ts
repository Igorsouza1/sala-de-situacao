import { db } from '@/db'
import { sql } from 'drizzle-orm'
import type { ConsultaItem } from '@/types/map-consulta'
import type { ConsultaQuery } from '@/lib/validations/map-consulta'

const PAGE_SIZE = 20
// Dados de Base são autorizados pela interseção com as Regiões da Organização.
function inRegion(alias: 'a' | 'p', tenantId: string, regiaoId: number) {
  return sql`EXISTS (SELECT 1 FROM monitoramento.regioes r
    WHERE r.id = ${regiaoId} AND r.organization_id = ${tenantId}::uuid
    AND ST_Intersects(${sql.identifier(alias)}.geom, r.geom))`
}
const propertyName = sql`COALESCE(NULLIF(p.nome, ''), NULLIF(p.properties->>'denominacao', ''), p.cod_imovel, 'Propriedade sem nome')`

export async function queryMapConsulta(tenantId: string, regiaoId: number, query: ConsultaQuery) {
  const action = query.kind === 'acoes'
  const alias = action ? 'a' : 'p'
  const geom = sql`${sql.identifier(alias)}.geom`
  const conditions = [inRegion(alias, tenantId, regiaoId)]
  if (action) conditions.push(sql`a.tenant_id = ${tenantId}::uuid`)
  if (query.id) conditions.push(sql`${sql.identifier(alias)}.id = ${query.id}`)
  if (query.bbox && !query.id) {
    const [w, s, e, n] = query.bbox
    conditions.push(sql`ST_Intersects(${geom}, ST_Transform(ST_MakeEnvelope(${w}, ${s}, ${e}, ${n}, 4326), 4674))`)
  }
  if (query.propriedade_id && action) conditions.push(sql`EXISTS (
    SELECT 1 FROM monitoramento.propriedades p WHERE p.id = ${query.propriedade_id}
    AND ${inRegion('p', tenantId, regiaoId)} AND ST_Intersects(p.geom, a.geom))`)
  if (query.q && !query.id) {
    const term = `%${query.q.replace(/[\\%_]/g, '\\$&')}%`
    conditions.push(action
      ? sql`(concat_ws(' ', a.name, a.categoria, a.tipo, a.descricao) ILIKE ${term}
          OR EXISTS (SELECT 1 FROM monitoramento.propriedades p
            WHERE ${inRegion('p', tenantId, regiaoId)} AND ST_Intersects(p.geom, a.geom)
            AND ${propertyName} ILIKE ${term}))`
      : sql`concat_ws(' ', p.nome, p.cod_imovel, p.properties->>'denominacao', p.properties->>'titular_nome') ILIKE ${term}`)
  }
  const properties = sql`COALESCE((SELECT jsonb_agg(jsonb_build_object(
    'id', p.id, 'nome', ${propertyName}, 'municipio', p.municipio) ORDER BY p.id)
    FROM monitoramento.propriedades p WHERE ${inRegion('p', tenantId, regiaoId)}
    AND ST_Intersects(p.geom, a.geom)), '[]'::jsonb)`
  const detail = query.id ? sql`, ST_AsGeoJSON(ST_Transform(${geom}, 4326))::json AS geometry,
    COALESCE((SELECT jsonb_agg(DISTINCT c.name)
      FROM monitoramento.layer_catalog c JOIN monitoramento.layer_data d ON d.layer_id = c.id
      WHERE c.slug = 'bacia-rio-da-prata'
        AND (c.tenant_id IS NULL OR c.tenant_id = ${tenantId}::uuid)
        AND (d.tenant_id IS NULL OR d.tenant_id = ${tenantId}::uuid)
        AND (c.regiao_id IS NULL OR c.regiao_id = ${regiaoId})
        AND ST_Intersects(d.geom, ${geom})), '[]'::jsonb) AS bacias` : sql``
  const columns = action ? sql`a.id, COALESCE(NULLIF(a.name, ''), a.tipo, a.categoria::text, 'Ação') AS nome,
    a.time AS data, a.categoria::text AS categoria, a.descricao, a.status::text AS status,
    a.eixo_tematico, a.tipo_tecnico, a.carater,
    NULL::text AS municipio, NULL::text AS car, NULL::text AS titular, NULL::float AS area,
    ${properties} AS propriedades`
    : sql`p.id, ${propertyName} AS nome, p.municipio, p.cod_imovel AS car,
      p.properties->>'titular_nome' AS titular, p.num_area AS area,
      NULL::timestamp AS data, NULL::text AS categoria`
  // Ações legadas não possuem created_at. O serial preserva a ordem de inserção,
  // independentemente da data da atividade (time).
  const result = await db.execute<ConsultaItem & Record<string, unknown>>(sql`
    SELECT ${columns} ${detail}
    FROM monitoramento.${sql.identifier(action ? 'acoes' : 'propriedades')} ${sql.identifier(alias)}
    WHERE ${sql.join(conditions, sql` AND `)}
    ORDER BY ${action ? sql`a.id DESC` : sql`${propertyName} ASC, p.id ASC`}
    LIMIT ${query.id ? 1 : PAGE_SIZE + 1} OFFSET ${query.id ? 0 : query.offset}`)
  return { items: result.rows.slice(0, PAGE_SIZE), hasMore: result.rows.length > PAGE_SIZE }
}
