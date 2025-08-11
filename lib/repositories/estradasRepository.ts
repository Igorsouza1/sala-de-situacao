import { db } from "@/db"



export async function findAllEstradasDataWithGeometry(){
    const result = await db.execute(`
        SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."estradas"
      `)

    return result

 }