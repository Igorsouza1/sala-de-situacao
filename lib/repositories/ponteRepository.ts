import { db } from "@/db"
import { ponteDoCureInMonitoramento } from "@/db/schema"
import { gte, lte } from "drizzle-orm"

export type NewPonteData = typeof ponteDoCureInMonitoramento.$inferInsert;


export async function findAllPonteData() {
  const result = await db
    .select({
      mes: ponteDoCureInMonitoramento.mes,
      data: ponteDoCureInMonitoramento.data,
      chuva: ponteDoCureInMonitoramento.chuva,
      nivel: ponteDoCureInMonitoramento.nivel,
      visibilidade: ponteDoCureInMonitoramento.visibilidade,
    })
    .from(ponteDoCureInMonitoramento)
    .execute()

  return result
}


export async function findPonteDataByDateRange(startDate: string, endDate: string) {
  let query = db
    .select()
    .from(ponteDoCureInMonitoramento).$dynamic()

  if (startDate) {
    query = query.where(gte(ponteDoCureInMonitoramento.data, startDate))
  }

  if (endDate) {
    query = query.where(lte(ponteDoCureInMonitoramento.data, endDate))
  }

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