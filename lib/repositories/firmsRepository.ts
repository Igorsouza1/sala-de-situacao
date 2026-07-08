import { db } from "@/db";
import { rawFirmsInMonitoramento } from "@/db/schema";
import { sql, and } from "drizzle-orm";

// NOTA (migração multi-tenant): a ingestão/notificação FIRMS vive nas Edge
// Functions standalone (supabase/functions/firms-sync|firms-notify — ADR 0009).
// Este repositório atende só os indicadores do dashboard (/api/fogo/*).

export async function findAllFirmsData() {
  const result = await db.execute(sql`
      SELECT id, acq_date, acq_time, frp, satellite, cod_imovel
      FROM "monitoramento"."raw_firms"
    `)

  return result
}

class FirmsRepository {
  async getFirmsDataByDateRange(startDate: string, endDate: string) {
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
          sql`${rawFirmsInMonitoramento.acqDate} >= ${startDate}`,
          sql`${rawFirmsInMonitoramento.acqDate} <= ${endDate}`
        )
      );
  }
}

export const firmsRepository = new FirmsRepository();
