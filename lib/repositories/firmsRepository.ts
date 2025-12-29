import { db } from "@/db";
import { rawFirmsInRioDaPrata } from "@/db/schema";



import { sql } from "drizzle-orm"

export async function findAllFirmsDataWithGeometry(startDate?: Date, endDate?: Date) {
  const whereClauses = [];

  if (startDate) {
    whereClauses.push(sql`acq_date >= ${startDate.toISOString().split('T')[0]}::date`);
  }
  if (endDate) {
    whereClauses.push(sql`acq_date <= ${endDate.toISOString().split('T')[0]}::date`);
  }

  const whereSql = whereClauses.length > 0
    ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
    : sql``;

  const result = await db.execute(sql`
        SELECT  acq_date, acq_time, ST_AsGeoJSON(geom) as geojson
        FROM "monitoramento"."raw_firms"
        ${whereSql}
      `)

  return result

}


export async function findAllFirmsData() {
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