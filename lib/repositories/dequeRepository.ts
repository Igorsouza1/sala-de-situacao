
import { db } from "@/db"
import { dequeDePedrasInMonitoramento } from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"


export type NewDequeData = typeof dequeDePedrasInMonitoramento.$inferInsert;


export async function findAllDequeData(tenantId: string) {
    const result = await db.select().from(dequeDePedrasInMonitoramento).where(eq(dequeDePedrasInMonitoramento.tenantId, tenantId))

    return result

}

export async function findDequeDataByDateRange(tenantId: string, startDate: string, endDate: string) {
    const conditions = [eq(dequeDePedrasInMonitoramento.tenantId, tenantId)]
  if (startDate) conditions.push(gte(dequeDePedrasInMonitoramento.data, startDate))
  if (endDate) conditions.push(lte(dequeDePedrasInMonitoramento.data, endDate))
  const query = db.select().from(dequeDePedrasInMonitoramento).where(and(...conditions))
  const result = await query.execute()

    return result
}



export async function insertDequeData(data: NewDequeData) {
    const [newRecord] = await db
        .insert(dequeDePedrasInMonitoramento)
        .values(data)
        .returning();

    return newRecord;
}