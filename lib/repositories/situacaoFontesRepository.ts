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
