import { db } from "@/db";
import { rawFirmsInMonitoramento, regioesInMonitoramento, destinatariosAlertasInMonitoramento } from "@/db/schema";
import { sql, eq, and, isNull } from "drizzle-orm";
import { InferInsertModel } from "drizzle-orm";

export type RawFirmInsert = InferInsertModel<typeof rawFirmsInMonitoramento>;

class FirmsRepository {
  async getActiveRegions() {
    // Assuming all regions are active for now, as verified in plan
    return await db
      .select({
        id: regioesInMonitoramento.id,
        nome: regioesInMonitoramento.nome,
        geom: sql<string>`ST_AsGeoJSON(${regioesInMonitoramento.geom})`, // PostGIS geometry as GeoJSON string
      })
      .from(regioesInMonitoramento);
  }

  async bulkInsertFirms(data: RawFirmInsert[]) {
    if (data.length === 0) return;

    // Use ON CONFLICT DO NOTHING to handle duplicates efficiently
    // The unique index idx_firms_point_unique handles duplication logic
    return await db
      .insert(rawFirmsInMonitoramento)
      .values(data)
      .onConflictDoNothing();
  }

  async getUnnotifiedFirms() {
    return await db
      .select()
      .from(rawFirmsInMonitoramento)
      .where(eq(rawFirmsInMonitoramento.alerta_enviado, false));
  }

  async markFirmsAsNotified(ids: string[]) {
    if (ids.length === 0) return;

    return await db
      .update(rawFirmsInMonitoramento)
      .set({ alerta_enviado: true })
      .where(sql`${rawFirmsInMonitoramento.id} IN ${ids}`);
  }

  async getRecipients(regiaoId: number) {
    return await db
      .select()
      .from(destinatariosAlertasInMonitoramento)
      .where(
        and(
          eq(destinatariosAlertasInMonitoramento.regiaoId, regiaoId),
          eq(destinatariosAlertasInMonitoramento.ativo, true)
        )
      );
  }
}

export const firmsRepository = new FirmsRepository();