import { db } from "@/db"
import { desmatamentoInMonitoramento } from "@/db/schema"

import { sql, and, eq, inArray } from "drizzle-orm"

/**
 * Busca os alertids já existentes no banco para uma região, a partir de uma lista.
 * Usa `inArray` (parametrizado) — NUNCA sql.raw() — para evitar SQL Injection.
 */
export async function findExistingDesmatamentoAlertids(
  regionId: number,
  alertids: string[]
): Promise<Set<string>> {
  if (alertids.length === 0) return new Set();

  const rows = await db
    .select({ alertid: desmatamentoInMonitoramento.alertid })
    .from(desmatamentoInMonitoramento)
    .where(
      and(
        eq(desmatamentoInMonitoramento.regiaoId, regionId),
        inArray(desmatamentoInMonitoramento.alertid, alertids)
      )
    );

  return new Set(rows.map((r) => r.alertid).filter((id): id is string => id !== null));
}

export async function findAllDesmatamentoData() {
  const result = await db.select(
    {
      alertid: desmatamentoInMonitoramento.alertid,
      alertha: desmatamentoInMonitoramento.alertha,
      detectat: desmatamentoInMonitoramento.detectat,
      detectyear: desmatamentoInMonitoramento.detectyear,
      state: desmatamentoInMonitoramento.state,
      stateha: desmatamentoInMonitoramento.stateha,
    }
  ).from(desmatamentoInMonitoramento).execute()

  return result
}