import { db } from "@/db"
import { javaliAvistamentosInMonitoramento } from "@/db/schema"
import { gte, lte, and, count } from "drizzle-orm"

export async function countJavaliAvistamentos() {
  const [row] = await db.select({ total: count() }).from(javaliAvistamentosInMonitoramento)
  return row?.total ?? 0
}

export async function findJavaliAvistamentosByDateRange(startDate: string, endDate: string) {
  return db
    .select({
      id: javaliAvistamentosInMonitoramento.id,
      createdAt: javaliAvistamentosInMonitoramento.createdAt,
    })
    .from(javaliAvistamentosInMonitoramento)
    .where(
      and(
        gte(javaliAvistamentosInMonitoramento.createdAt, startDate),
        lte(javaliAvistamentosInMonitoramento.createdAt, endDate)
      )
    )
    .execute()
}
