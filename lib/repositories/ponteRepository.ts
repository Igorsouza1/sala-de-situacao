import { db } from "@/db"
import { ponteDoCureInMonitoramento } from "@/db/schema"
import { eq, and, gte, lte } from "drizzle-orm"

export type NewPonteData = typeof ponteDoCureInMonitoramento.$inferInsert;


export async function findAllPonteData(tenantId: string) {
  const result = await db
    .select({
      mes: ponteDoCureInMonitoramento.mes,
      data: ponteDoCureInMonitoramento.data,
      chuva: ponteDoCureInMonitoramento.chuva,
      nivel: ponteDoCureInMonitoramento.nivel,
      visibilidade: ponteDoCureInMonitoramento.visibilidade,
    })
    .from(ponteDoCureInMonitoramento).where(eq(ponteDoCureInMonitoramento.tenantId, tenantId))
    .execute()

  return result
}


export async function findPonteDataByDateRange(tenantId: string, startDate: string, endDate: string) {
  const conditions = [eq(ponteDoCureInMonitoramento.tenantId, tenantId)]
  if (startDate) conditions.push(gte(ponteDoCureInMonitoramento.data, startDate))
  if (endDate) conditions.push(lte(ponteDoCureInMonitoramento.data, endDate))
  const query = db.select().from(ponteDoCureInMonitoramento).where(and(...conditions))
  const result = await query.execute()

  return result
}



export async function insertPonteData(data: NewPonteData) {
  const [newRecord] = await db
    .insert(ponteDoCureInMonitoramento)
    .values(data)
    .returning();

  return newRecord;
}