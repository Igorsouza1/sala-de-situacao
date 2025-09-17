import { db } from "@/db";
import { rawFirmsInRioDaPrata } from "@/db/schema";



export async function findAllFirmsDataWithGeometry(){
    const result = await db.execute(`
        SELECT  acq_date, acq_time, ST_AsGeoJSON(geom) as geojson
        FROM "rio_da_prata"."raw_firms"
      `)

    return result

    }


export async function findAllFirmsData(){
  const result = await db
      .select({
        acq_date: rawFirmsInRioDaPrata.acqDate,
        bright_ti4: rawFirmsInRioDaPrata.brightTi4,
        scan: rawFirmsInRioDaPrata.scan,
        track: rawFirmsInRioDaPrata.track,
        acq_time: rawFirmsInRioDaPrata.acqTime,
        satellite: rawFirmsInRioDaPrata.satellite,
        instrument: rawFirmsInRioDaPrata.instrument,
        confidence: rawFirmsInRioDaPrata.confidence,
        version: rawFirmsInRioDaPrata.version,
      })
      .from(rawFirmsInRioDaPrata)
      .execute()

  return result
}