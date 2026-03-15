import { db } from "@/db"
import { javaliAvistamentosInMonitoramento } from "@/db/schema"
import { gte, lte, and } from "drizzle-orm"

export async function findAllJavaliAvistamentos() {
  return db
    .select({
      id: javaliAvistamentosInMonitoramento.id,
      tipo: javaliAvistamentosInMonitoramento.tipo,
      createdAt: javaliAvistamentosInMonitoramento.createdAt,
    })
    .from(javaliAvistamentosInMonitoramento)
    .execute()
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
