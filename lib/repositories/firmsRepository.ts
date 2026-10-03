import { db } from "@/db";
import { rawFirmsInMonitoramento } from "@/db/schema";
import { sql, and } from "drizzle-orm";

// NOTA (migração multi-tenant): a ingestão/notificação FIRMS vive nas Edge
// Functions standalone (supabase/functions/firms-sync|firms-notify — ADR 0009).
// Este repositório atende só os indicadores do dashboard (/api/fogo/*).

// EXISTS mantém cada Foco de Calor único mesmo em Regiões sobrepostas.
function firmsReadScope(tenantId: string, isSuperadmin: boolean, regiaoId?: number) {
  if (isSuperadmin && regiaoId == null) return sql`true`;
  return sql`EXISTS (
    SELECT 1 FROM monitoramento.firms_regioes fr
    JOIN monitoramento.regioes r ON r.id = fr.regiao_id
    WHERE fr.firm_id = ${rawFirmsInMonitoramento.id}
      ${isSuperadmin ? sql`` : sql`AND r.organization_id = ${tenantId}::uuid`}
      ${regiaoId == null ? sql`` : sql`AND r.id = ${regiaoId}`}
  )`;
}

export async function findAllFirmsData(tenantId: string, isSuperadmin: boolean, regiaoId?: number) {
  const result = await db.execute(sql`
      SELECT id, acq_date, acq_time, frp, satellite, cod_imovel
      FROM "monitoramento"."raw_firms"
      WHERE ${firmsReadScope(tenantId, isSuperadmin, regiaoId)}
    `)

  return result
}

class FirmsRepository {
  async getFirmsDataByDateRange(tenantId: string, isSuperadmin: boolean, startDate: string, endDate: string, regiaoId?: number) {
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
          firmsReadScope(tenantId, isSuperadmin, regiaoId),
          sql`${rawFirmsInMonitoramento.acqDate} >= ${startDate}`,
          sql`${rawFirmsInMonitoramento.acqDate} <= ${endDate}`
        )
      );
  }
}

export const firmsRepository = new FirmsRepository();
