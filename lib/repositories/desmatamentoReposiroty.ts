import { db } from "@/db"


export async function findAllDesmatamentoDataWithGeometry(){ 
    const result = await db.execute(`
      SELECT id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha, ST_AsGeoJSON(geom) as geojson
      FROM "rio_da_prata"."desmatamento"
    `)

    return result
}