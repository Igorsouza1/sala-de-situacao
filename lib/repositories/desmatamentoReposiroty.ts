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

export async function findAllDesmatamentoData(tenantId: string, isSuperadmin: boolean, regiaoId?: number) {
  // A associação pode existir em várias Regiões; hectares contam uma única vez.
  const scope = isSuperadmin && regiaoId == null ? sql`true` : sql`EXISTS (
    SELECT 1 FROM monitoramento.desmatamento_regioes dr
    JOIN monitoramento.regioes r ON r.id = dr.regiao_id
    WHERE dr.desmatamento_id = ${desmatamentoInMonitoramento.id}
      ${isSuperadmin ? sql`` : sql`AND r.organization_id = ${tenantId}::uuid`}
      ${regiaoId == null ? sql`` : sql`AND r.id = ${regiaoId}`}
  )`;
  const result = await db.select(
    {
      alertid: desmatamentoInMonitoramento.alertid,
      alertha: desmatamentoInMonitoramento.alertha,
      detectat: desmatamentoInMonitoramento.detectat,
      detectyear: desmatamentoInMonitoramento.detectyear,
      state: desmatamentoInMonitoramento.state,
      stateha: desmatamentoInMonitoramento.stateha,
    }
  ).from(desmatamentoInMonitoramento).where(scope).execute()

  return result
}
