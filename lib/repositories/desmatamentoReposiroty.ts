import { db } from "@/db"
import { desmatamentoInRioDaPrata } from "@/db/schema"


export async function findAllDesmatamentoDataWithGeometry() {
  const result = await db.execute(`
      SELECT id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha, ST_AsGeoJSON(geom) as geojson
      FROM "monitoramento"."desmatamento"
    `)

  return result
}

export async function findAllDesmatamentoData() {
  const result = await db.select(
    {
      alertid: desmatamentoInRioDaPrata.alertid,
      alertha: desmatamentoInRioDaPrata.alertha,
      detectat: desmatamentoInRioDaPrata.detectat,
      detectyear: desmatamentoInRioDaPrata.detectyear,
      state: desmatamentoInRioDaPrata.state,
      stateha: desmatamentoInRioDaPrata.stateha,
    }
  ).from(desmatamentoInRioDaPrata).execute()

  return result
}