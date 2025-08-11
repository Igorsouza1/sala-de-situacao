import { db } from "@/db";



export async function findAllFirmsDataWithGeometry(){
    const result = await db.execute(`
        SELECT  acq_date, acq_time, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."raw_firms"
      `)

    return result

    }