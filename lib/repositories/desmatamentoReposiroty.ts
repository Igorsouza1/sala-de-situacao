import { db } from "@/db"
import { desmatamento } from "@/db/schema"
import { eq, sql } from "drizzle-orm"


export async function findAllDesmatamentoDataWithGeometry(regiaoId: number){
    const result = await db.execute(sql`
      SELECT id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha, ST_AsGeoJSON(geom) as geojson
      FROM desmatamento
      WHERE regiao_id = ${regiaoId}
    `)

    return result
}

export async function findAllDesmatamentoData(regiaoId: number){
  const result = await db.select(
    {
      alertid: desmatamento.alertid,
      alertha: desmatamento.alertha,
      detectat: desmatamento.detectat,
      detectyear: desmatamento.detectyear,
      state: desmatamento.state,
      stateha: desmatamento.stateha,
    }
  ).from(desmatamento).where(eq(desmatamento.regiaoId, regiaoId)).execute()
  
  return result
}