import { db } from '@/db'
import { sql } from 'drizzle-orm'
import type { CatalogoLinha, Presenca } from '@/lib/situacao/fontes'

// O que a Situação precisa saber de uma região para decidir os assuntos (lib/situacao/fontes.ts): as camadas dela e se há registro
// de cada assunto. Focos e alertas pela ligação com a região; javali pelo lugar (cai dentro dela); as estações, que não têm lugar
// guardado, pela organização dona da região. Só "existe?", nunca a contagem: é o que basta, e o banco para no primeiro.

export async function lerFontesDaRegiao(regiaoId: number): Promise<{ catalogo: CatalogoLinha[]; presenca: Presenca } | null> {
  const presenca = await db.execute<{ id: number; focos: boolean; desmatamento: boolean; javali: boolean; formoso: boolean; prata: boolean; cure: boolean }>(sql`
    SELECT r.id,
      EXISTS (SELECT 1 FROM monitoramento.firms_regioes WHERE regiao_id = r.id) AS focos,
      EXISTS (SELECT 1 FROM monitoramento.desmatamento_regioes WHERE regiao_id = r.id) AS desmatamento,
      EXISTS (SELECT 1 FROM monitoramento.javali_avistamentos j WHERE ST_Intersects(r.geom, j.geom)) AS javali,
      EXISTS (SELECT 1 FROM monitoramento.balneario_municipal WHERE tenant_id = r.organization_id) AS formoso,
      EXISTS (SELECT 1 FROM monitoramento.deque_de_pedras WHERE tenant_id = r.organization_id) AS prata,
      EXISTS (SELECT 1 FROM monitoramento.ponte_do_cure WHERE tenant_id = r.organization_id) AS cure
    FROM monitoramento.regioes r
    WHERE r.id = ${regiaoId}
  `)
  const p = presenca.rows[0]
  if (!p) return null

  const catalogo = await db.execute<{ slug: string; name: string; schema_config: unknown }>(sql`
    SELECT slug, name, schema_config FROM monitoramento.layer_catalog WHERE regiao_id = ${regiaoId}
  `)
  return {
    catalogo: catalogo.rows.map((c) => ({ slug: c.slug, name: c.name, schemaConfig: c.schema_config })),
    presenca: { focos: !!p.focos, desmatamento: !!p.desmatamento, javali: !!p.javali, formoso: !!p.formoso, prata: !!p.prata, cure: !!p.cure },
  }
}

/** Os alertas de uma camada importada da região: as propriedades e a área da geometria (para quando o alerta não diz a área). */
export async function lerAlertasDaCamada(regiaoId: number, slug: string): Promise<{ properties: Record<string, unknown> | null; haGeom: number | null }[] | null> {
  const camada = await db.execute<{ id: number }>(sql`
    SELECT id FROM monitoramento.layer_catalog WHERE slug = ${slug} AND regiao_id = ${regiaoId}
  `)
  const id = camada.rows[0]?.id
  if (!id) return null
  const linhas = await db.execute<{ properties: Record<string, unknown> | null; ha_geom: number | null }>(sql`
    SELECT properties, ST_Area(geom::geography) / 10000 AS ha_geom FROM monitoramento.layer_data WHERE layer_id = ${id}
  `)
  return linhas.rows.map((l) => ({ properties: l.properties, haGeom: l.ha_geom === null ? null : Number(l.ha_geom) }))
}

// ── Recorte por área (a pessoa clicou num polígono do mapa) ─────────────────────────────────────────────────────────────

/** A área clicada: um polígono de uma camada da região (ou global). Só a parte de área da geometria (coleções viram polígonos). */
export async function lerAreaClicada(regiaoId: number, slug: string, featureId: number): Promise<{
  camada: string
  properties: Record<string, unknown> | null
  ha: number
  geometria: import('geojson').Polygon | import('geojson').MultiPolygon
} | null> {
  const r = await db.execute<{ camada: string; properties: Record<string, unknown> | null; ha: number; geometria: unknown }>(sql`
    SELECT c.name AS camada, d.properties, ST_Area(x.g::geography) / 10000 AS ha, ST_AsGeoJSON(x.g)::json AS geometria
    FROM monitoramento.layer_catalog c
    JOIN monitoramento.layer_data d ON d.layer_id = c.id
    CROSS JOIN LATERAL (SELECT ST_CollectionExtract(ST_MakeValid(d.geom), 3) AS g) x
    WHERE c.slug = ${slug} AND d.id = ${featureId}
      AND (c.regiao_id = ${regiaoId} OR c.scope = 'global')
      AND NOT ST_IsEmpty(x.g)
  `)
  const row = r.rows[0]
  if (!row) return null
  const g = row.geometria as { type?: string }
  if (g?.type !== 'Polygon' && g?.type !== 'MultiPolygon') return null
  return { camada: row.camada, properties: row.properties, ha: Number(row.ha), geometria: row.geometria as never }
}

/** A série gravada de um raster de classes da região (o fluxo comprimido) e a grade dele. */
export async function lerSerieRaster(regiaoId: number, slug: string): Promise<{ data: Buffer; raster: Record<string, unknown> } | null> {
  const r = await db.execute<{ data: Buffer; raster: Record<string, unknown> }>(sql`
    SELECT s.data, c.schema_config->'raster' AS raster
    FROM monitoramento.layer_catalog c JOIN monitoramento.layer_raster_series s ON s.layer_id = c.id
    WHERE c.slug = ${slug} AND c.regiao_id = ${regiaoId}
  `)
  return r.rows[0] ?? null
}

type AlertaRecortado = { properties: Record<string, unknown> | null; haGeom: number | null }
const recortados = (rows: { properties: Record<string, unknown> | null; ha_geom: number | null }[]): AlertaRecortado[] =>
  rows.map((l) => ({ properties: l.properties, haGeom: l.ha_geom === null ? null : Number(l.ha_geom) }))

/** Os alertas da tabela ligados à região que tocam a área, com a área só do pedaço de dentro. */
export async function lerAlertasDaTabelaNaArea(regiaoId: number, featureId: number): Promise<AlertaRecortado[]> {
  const r = await db.execute<{ properties: Record<string, unknown> | null; ha_geom: number | null }>(sql`
    WITH a AS (SELECT ST_CollectionExtract(ST_MakeValid(geom), 3) AS g FROM monitoramento.layer_data WHERE id = ${featureId})
    SELECT jsonb_build_object('detectat', d.detectat, 'detectyear', d.detectyear) AS properties,
      ST_Area(ST_Intersection(ST_MakeValid(d.geom), ST_Transform(a.g, ST_SRID(d.geom)))::geography) / 10000 AS ha_geom
    FROM monitoramento.desmatamento d
    JOIN monitoramento.desmatamento_regioes j ON j.desmatamento_id = d.id AND j.regiao_id = ${regiaoId}
    CROSS JOIN a
    WHERE ST_Intersects(d.geom, ST_Transform(a.g, ST_SRID(d.geom)))
  `)
  return recortados(r.rows)
}

/** Os alertas de uma camada importada da região que tocam a área, com a área só do pedaço de dentro. */
export async function lerAlertasDaCamadaNaArea(regiaoId: number, slug: string, featureId: number): Promise<AlertaRecortado[]> {
  const r = await db.execute<{ properties: Record<string, unknown> | null; ha_geom: number | null }>(sql`
    WITH a AS (SELECT ST_CollectionExtract(ST_MakeValid(geom), 3) AS g FROM monitoramento.layer_data WHERE id = ${featureId})
    SELECT d.properties,
      ST_Area(ST_Intersection(ST_MakeValid(d.geom), ST_Transform(a.g, ST_SRID(d.geom)))::geography) / 10000 AS ha_geom
    FROM monitoramento.layer_catalog c
    JOIN monitoramento.layer_data d ON d.layer_id = c.id
    CROSS JOIN a
    WHERE c.slug = ${slug} AND c.regiao_id = ${regiaoId}
      AND ST_Intersects(d.geom, ST_Transform(a.g, ST_SRID(d.geom)))
  `)
  return recortados(r.rows)
}
