import { db } from "@/db"
import { sql } from "drizzle-orm"

export interface OcorrenciaNaPropriedade extends Record<string, unknown> {
  propriedadeId: number
  nome: string | null
  codImovel: string | null
  areaPropriedade: number | null
  geometriaPropriedade: unknown
  alertaId: number
  data: string | null
  areaTotal: number | null
  areaNaPropriedade: number
  geometriaArea: unknown
}

/** O alerta e cada ocorrência precisam estar vinculados à região acessível. */
export async function findRelatorioDesmatamento(
  alertaId: number,
  tenantId: string,
  isSuperadmin: boolean,
  regiaoIds?: number | number[],
) {
  const ids = regiaoIds == null ? null : Array.isArray(regiaoIds) ? regiaoIds : [regiaoIds]
  const regionFilter = ids == null ? sql`true` : ids.length
    ? sql`r.id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
    : sql`false`
  const tenantFilter = isSuperadmin ? sql`true` : sql`r.organization_id = ${tenantId}::uuid`
  const scoped = (alias: "alvo" | "d") => isSuperadmin && ids == null ? sql`true` : sql`EXISTS (
    SELECT 1 FROM monitoramento.desmatamento_regioes dr
    JOIN monitoramento.regioes r ON r.id = dr.regiao_id
    WHERE dr.desmatamento_id = ${sql.raw(alias)}.id AND ${tenantFilter} AND ${regionFilter}
  )`

  const target = await db.execute<{ id: number; data: string | null; area_total: number | null }>(sql`
    SELECT alvo.id, alvo.detectat AS data, alvo.alertha AS area_total
    FROM monitoramento.desmatamento alvo
    WHERE alvo.id = ${alertaId} AND ${scoped("alvo")}
  `)
  const alerta = target.rows[0]
  if (!alerta) return null

  const result = await db.execute<OcorrenciaNaPropriedade>(sql`
    WITH alvo AS (
      SELECT alvo.geom FROM monitoramento.desmatamento alvo
      WHERE alvo.id = ${alertaId} AND ${scoped("alvo")}
    ), propriedades AS (
      SELECT p.id, p.nome, p.cod_imovel, p.num_area, p.geom
      FROM monitoramento.propriedades p CROSS JOIN alvo
      WHERE ST_Intersects(p.geom, alvo.geom)
        AND ${isSuperadmin && ids == null ? sql`true` : sql`EXISTS (
          SELECT 1 FROM monitoramento.desmatamento_regioes dr
          JOIN monitoramento.regioes r ON r.id = dr.regiao_id
          WHERE dr.desmatamento_id = ${alertaId}
            AND ${tenantFilter} AND ${regionFilter}
            AND ST_Intersects(p.geom, r.geom)
        )`}
    )
    SELECT
      p.id AS "propriedadeId", p.nome, p.cod_imovel AS "codImovel",
      p.num_area AS "areaPropriedade",
      ST_AsGeoJSON(ST_SimplifyPreserveTopology(p.geom, 0.00005), 5)::json AS "geometriaPropriedade",
      d.id AS "alertaId", d.detectat AS data, d.alertha AS "areaTotal",
      (ST_Area(recorte.geom::geography) / 10000)::float AS "areaNaPropriedade",
      ST_AsGeoJSON(recorte.geom, 5)::json AS "geometriaArea"
    FROM propriedades p
    JOIN monitoramento.desmatamento d ON ST_Intersects(d.geom, p.geom) AND ${scoped("d")}
    CROSS JOIN LATERAL (
      SELECT ST_CollectionExtract(ST_Intersection(d.geom, p.geom), 3) AS geom
    ) recorte
    WHERE NOT ST_IsEmpty(recorte.geom) AND ST_Area(recorte.geom::geography) > 0
    ORDER BY p.id, d.detectat DESC NULLS LAST, d.id DESC
  `)

  return { alerta: { id: alerta.id, data: alerta.data, areaTotal: alerta.area_total }, ocorrencias: result.rows }
}
