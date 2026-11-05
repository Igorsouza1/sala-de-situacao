import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { parseLayout, removeLayerFromLayout } from '@/components/map/helpers/layer-layout'

// Excluir uma camada e TUDO o que é dela (DESIGN.md 13.1, "Excluir"), numa transação: ou sai tudo, ou nada sai.
// - as feições enviadas (layer_data: a chave não apaga em cascata, sem isto ficariam órfãs);
// - a linha do catálogo, que leva junto, em cascata, as feições importadas (layer_features), o raster (layer_rasters) e a série de
//   anos (layer_raster_series);
// - a camada nas pastas, na ordem, na cor e na memória do interruptor de TODAS as pessoas (user_map_layouts). O mapa já esqueceria
//   a camada sozinho ao abrir, mas o pedido é que nada relacionado fique para trás.

export interface DeletedLayer {
  features: number
  layouts: number
}

/** o slug como aparece no JSON do layout, pronto para um LIKE (o "_" e o "%" valem como letra) */
const likeSlug = (slug: string) => `%${JSON.stringify(slug).replace(/[\\%_]/g, (c) => `\\${c}`)}%`

export async function deleteLayerEverywhere(layer: { id: number; slug: string }): Promise<DeletedLayer> {
  return db.transaction(async (tx) => {
    const data = await tx.execute(sql`DELETE FROM monitoramento.layer_data WHERE layer_id = ${layer.id}`)
    const imported = await tx.execute<{ n: number }>(sql`SELECT COUNT(*)::int AS n FROM monitoramento.layer_features WHERE layer_id = ${layer.id}`)
    await tx.execute(sql`DELETE FROM monitoramento.layer_catalog WHERE id = ${layer.id}`)

    const rows = await tx.execute<{ user_id: string; regiao_id: number; layout: unknown }>(sql`
      SELECT user_id::text AS user_id, regiao_id, layout FROM monitoramento.user_map_layouts
      WHERE layout::text LIKE ${likeSlug(layer.slug)}
    `)
    let layouts = 0
    for (const row of rows.rows) {
      const saved = parseLayout(row.layout)
      if (!saved) continue
      const next = removeLayerFromLayout(saved, layer.slug)
      if (next === saved) continue
      await tx.execute(sql`
        UPDATE monitoramento.user_map_layouts SET layout = ${JSON.stringify(next)}::jsonb
        WHERE user_id = ${row.user_id}::uuid AND regiao_id = ${row.regiao_id}
      `)
      layouts++
    }
    return { features: (data.rowCount ?? 0) + (imported.rows[0]?.n ?? 0), layouts }
  })
}
