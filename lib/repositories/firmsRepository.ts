import { db } from "@/db";
import { rawFirms } from "@/db/schema";
import { eq, sql } from "drizzle-orm";



export async function findAllFirmsDataWithGeometry(regiaoId: number){
    const result = await db.execute(sql`
        SELECT  acq_date, acq_time, ST_AsGeoJSON(geom) as geojson
        FROM raw_firms
        WHERE regiao_id = ${regiaoId}
      `)

    return result

    }


export async function findAllFirmsData(regiaoId: number){
  const result = await db
      .select({
        acq_date: rawFirms.acqDate,
        bright_ti4: rawFirms.brightTi4,
        scan: rawFirms.scan,
        track: rawFirms.track,
        acq_time: rawFirms.acqTime,
        satellite: rawFirms.satellite,
        instrument: rawFirms.instrument,
        confidence: rawFirms.confidence,
        version: rawFirms.version,
      })
      .from(rawFirms)
      .where(eq(rawFirms.regiaoId, regiaoId))
      .execute()

  return result
}