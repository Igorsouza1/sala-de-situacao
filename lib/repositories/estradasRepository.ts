import { db, sql } from "@/db"
import { estradasInMonitoramento, type NewEstradaData } from "@/db/schema";



export async function findAllEstradasDataWithGeometry() {
  const result = await db.execute(`
        SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
        FROM "monitoramento"."estradas"
      `)

  return result

}


export async function insertEstradaData(data: NewEstradaData) {
  const [newRecord] = await db
    .insert(estradasInMonitoramento)
    .values({
      nome: data.nome,
      tipo: data.tipo,
      codigo: data.codigo,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: estradasInMonitoramento.id });

  return newRecord;
}