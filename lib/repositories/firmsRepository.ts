import { db } from "@/db";
import { rawFirmsInMonitoramento } from "@/db/schema";
import { sql, and } from "drizzle-orm";

// NOTA (migração multi-tenant): a ingestão/notificação FIRMS vive nas Edge
// Functions standalone (supabase/functions/firms-sync|firms-notify — ADR 0009).
// Este repositório atende só os indicadores do dashboard (/api/fogo/*).

// EXISTS mantém cada Foco de Calor único mesmo em Regiões sobrepostas.
function firmsReadScope(tenantId: string, isSuperadmin: boolean, regiaoIds?: number | number[]) {
  if (isSuperadmin && regiaoIds == null) return sql`true`;
  const regionFilter = regiaoIds == null ? sql`` : Array.isArray(regiaoIds)
    ? regiaoIds.length ? sql`AND r.id IN (${sql.join(regiaoIds.map(id => sql`${id}`), sql`, `)})` : sql`AND false`
    : sql`AND r.id = ${regiaoIds}`;
  return sql`EXISTS (
    SELECT 1 FROM monitoramento.firms_regioes fr
    JOIN monitoramento.regioes r ON r.id = fr.regiao_id
    WHERE fr.firm_id = ${rawFirmsInMonitoramento.id}
      ${isSuperadmin ? sql`` : sql`AND r.organization_id = ${tenantId}::uuid`}
      ${regionFilter}
  )`;
}

export async function findAllFirmsData(tenantId: string, isSuperadmin: boolean, regiaoIds?: number | number[]) {
  const result = await db.execute(sql`
      SELECT id, acq_date, acq_time, frp, satellite, cod_imovel
      FROM "monitoramento"."raw_firms"
      WHERE ${firmsReadScope(tenantId, isSuperadmin, regiaoIds)}
    `)

  return result
}

class FirmsRepository {
  async getFirmsDataByDateRange(tenantId: string, isSuperadmin: boolean, startDate: string, endDate: string, regiaoIds?: number | number[]) {
    return await db
      .select({
        id: rawFirmsInMonitoramento.id,
        acqDate: rawFirmsInMonitoramento.acqDate,
        acqTime: rawFirmsInMonitoramento.acqTime,
        latitude: rawFirmsInMonitoramento.latitude,
        longitude: rawFirmsInMonitoramento.longitude,
      })
      .from(rawFirmsInMonitoramento)
      .where(
        and(
          firmsReadScope(tenantId, isSuperadmin, regiaoIds),
          sql`${rawFirmsInMonitoramento.acqDate} >= ${startDate}`,
          sql`${rawFirmsInMonitoramento.acqDate} <= ${endDate}`
        )
      );
  }
}

export const firmsRepository = new FirmsRepository();
