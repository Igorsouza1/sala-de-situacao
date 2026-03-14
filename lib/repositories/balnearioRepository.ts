import { db } from "@/db"
import { balnearioMunicipalInMonitoramento } from "@/db/schema"
import { gte, lte } from "drizzle-orm"

export type NewBalnearioData = typeof balnearioMunicipalInMonitoramento.$inferInsert;

export async function findAllBalnearioData() {
  const result = await db.select().from(balnearioMunicipalInMonitoramento)
  return result
}

export async function findBalnearioDataByDateRange(startDate: string, endDate: string) {
  let query = db
    .select()
    .from(balnearioMunicipalInMonitoramento).$dynamic()

  if (startDate) {
    query = query.where(gte(balnearioMunicipalInMonitoramento.data, startDate))
  }

  if (endDate) {
    query = query.where(lte(balnearioMunicipalInMonitoramento.data, endDate))
  }

  return query.execute()
}

export async function insertBalnearioData(data: NewBalnearioData) {
  const [newRecord] = await db
    .insert(balnearioMunicipalInMonitoramento)
    .values(data)
    .returning();

  return newRecord;
}
