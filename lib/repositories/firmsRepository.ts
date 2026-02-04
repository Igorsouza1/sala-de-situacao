import { db } from "@/db";
import { rawFirmsInMonitoramento, regioesInMonitoramento, destinatariosAlertasInMonitoramento, propriedadesInMonitoramento } from "@/db/schema";
import { sql, eq, and, isNull } from "drizzle-orm";
import { InferInsertModel } from "drizzle-orm";

export type RawFirmInsert = InferInsertModel<typeof rawFirmsInMonitoramento>;

class FirmsRepository {
  async getActiveRegions() {
    // Assuming all regions are active for now
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
    return await db
      .insert(rawFirmsInMonitoramento)
      .values(data)
      .onConflictDoNothing();
  }

  // --- ENRICHMENT LAYER (Layer 2) ---
  async enrichFirmsWithCAR() {
    // Spatial Join: Update raw_firms with cod_imovel where the point intersects a property
    // Only for firms that don't have a cod_imovel yet
    // Using raw SQL for performance and specific PostGIS syntax "FROM ... WHERE ST_Intersects..."

    // Note: In standard SQL/Postgres UPDATE FROM syntax:
    // UPDATE target SET val = source.val FROM source WHERE condition

    await db.execute(sql`
        UPDATE "monitoramento"."raw_firms" AS rf
        SET "cod_imovel" = p."cod_imovel"
        FROM "monitoramento"."propriedades" AS p
        WHERE rf."cod_imovel" IS NULL
          AND ST_Intersects(rf.geom, ST_Transform(p.geom, 4674))
    `);
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