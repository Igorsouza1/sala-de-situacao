import { db, sql } from "@/db"
import { estradas, type NewEstradaData } from "@/db/schema";



export async function findAllEstradasDataWithGeometry(regiaoId: number){
    const result = await db.execute(sql`
        SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
        FROM estradas
        WHERE regiao_id = ${regiaoId}
      `)

    return result

 }


export async function insertEstradaData(data: NewEstradaData){
  const [newRecord] = await db
  .insert(estradas)
  .values({
    ...data,
    geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4326)`,
  })
  .returning({ id: estradas.id });

return newRecord;
}