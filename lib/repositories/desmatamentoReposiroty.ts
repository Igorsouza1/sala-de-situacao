import { db } from "@/db"
import { desmatamentoInRioDaPrata } from "@/db/schema"


import { sql } from "drizzle-orm"

export async function findAllDesmatamentoDataWithGeometry(startDate?: Date, endDate?: Date) {
  const whereClauses = [];

  if (startDate) {
    whereClauses.push(sql`detectat::date >= ${startDate.toISOString().split('T')[0]}::date`);
  }
  if (endDate) {
    whereClauses.push(sql`detectat::date <= ${endDate.toISOString().split('T')[0]}::date`);
  }

  const whereSql = whereClauses.length > 0
    ? sql`WHERE ${sql.join(whereClauses, sql` AND `)}`
    : sql``;

  const result = await db.execute(sql`
      SELECT id, alertid, alertcode, alertha, source, detectat, detectyear, state, stateha, ST_AsGeoJSON(geom) as geojson
      FROM "monitoramento"."desmatamento"
      ${whereSql}
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