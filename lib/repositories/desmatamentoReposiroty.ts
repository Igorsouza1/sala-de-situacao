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

export async function findAllDesmatamentoData(tenantId: string, isSuperadmin: boolean, regiaoIds?: number | number[]) {
  // A associação pode existir em várias Regiões; hectares contam uma única vez.
  const regionFilter = regiaoIds == null ? sql`` : Array.isArray(regiaoIds)
    ? regiaoIds.length ? sql`AND r.id IN (${sql.join(regiaoIds.map(id => sql`${id}`), sql`, `)})` : sql`AND false`
    : sql`AND r.id = ${regiaoIds}`;
  const scope = isSuperadmin && regiaoIds == null ? sql`true` : sql`EXISTS (
    SELECT 1 FROM monitoramento.desmatamento_regioes dr
    JOIN monitoramento.regioes r ON r.id = dr.regiao_id
    WHERE dr.desmatamento_id = ${desmatamentoInMonitoramento.id}
      ${isSuperadmin ? sql`` : sql`AND r.organization_id = ${tenantId}::uuid`}
      ${regionFilter}
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
