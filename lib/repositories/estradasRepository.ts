import { db, sql } from "@/db"
import { estradasInRioDaPrata } from "@/db/schema";


export type NewEstradaData = typeof estradasInRioDaPrata.$inferInsert;

export async function findAllEstradasDataWithGeometry(){
    const result = await db.execute(`
        SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."estradas"
      `)

    return result

 }


export async function insertEstradaData(data: NewEstradaData){
  const [newRecord] = await db
  .insert(estradasInRioDaPrata)
  .values({
    nome: data.nome,
    tipo: data.tipo,
    codigo: data.codigo,
    // Aqui está a mágica!
    // Usamos a função do PostGIS para converter nosso texto WKT em geometria
    geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4326)`,
  })
  .returning({ id: estradasInRioDaPrata.id });

return newRecord;
}