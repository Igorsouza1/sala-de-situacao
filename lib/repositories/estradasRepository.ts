import { db, sql } from "@/db"
import { estradasInMonitoramento, type NewEstradaData } from "@/db/schema";


export async function insertEstradaData(data: NewEstradaData) {
  if (!data.tenantId) throw new Error("tenantId é obrigatório para criar estrada");
  const [newRecord] = await db
    .insert(estradasInMonitoramento)
    .values({
      nome: data.nome,
      tipo: data.tipo,
      codigo: data.codigo,
      tenantId: data.tenantId,
      regiaoId: data.regiaoId,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: estradasInMonitoramento.id });

  return newRecord;
}

export async function findAllEstradasData(tenantId: string, isSuperadmin = false, regionIds: number[] | null = null) {
  if (!tenantId) throw new Error("tenantId é obrigatório para consultar estradas");
  const result = await db.execute(sql`
    SELECT id, nome, tipo, codigo, regiao_id, ST_AsGeoJSON(geom) AS geojson
    FROM monitoramento.estradas
    WHERE ${isSuperadmin ? sql`TRUE` : sql`tenant_id = ${tenantId}::uuid`}
      ${regionIds === null ? sql`` : regionIds.length ? sql`AND regiao_id IN (${sql.join(regionIds.map(id => sql`${id}`), sql`, `)})` : sql`AND FALSE`}
  `);
  return result.rows;
}
