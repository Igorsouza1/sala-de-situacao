import { db } from "@/db"
import { balnearioMunicipalInMonitoramento } from "@/db/schema"
import { and, gte, lte } from "drizzle-orm"

export type NewBalnearioData = typeof balnearioMunicipalInMonitoramento.$inferInsert;

export async function findAllBalnearioData() {
  const result = await db.select().from(balnearioMunicipalInMonitoramento)
  return result
}

export async function findBalnearioDataByDateRange(startDate: string, endDate: string) {
  const conditions = []

  if (startDate) conditions.push(gte(balnearioMunicipalInMonitoramento.data, startDate))
  if (endDate)   conditions.push(lte(balnearioMunicipalInMonitoramento.data, endDate))

  const query = db
    .select()
    .from(balnearioMunicipalInMonitoramento)
    .where(conditions.length ? and(...conditions) : undefined)

  return query.execute()
}

export async function insertBalnearioData(data: NewBalnearioData) {
  const [newRecord] = await db
    .insert(balnearioMunicipalInMonitoramento)
    .values(data)
    .returning();

  return newRecord;
}
