import { db, sql } from "@/db"
import { estradasInMonitoramento, type NewEstradaData } from "@/db/schema";



export async function findAllEstradasDataWithGeometry(tenantId?: string | null) {
  const effectiveTenantId = tenantId ?? process.env.SEED_TENANT_ID;

  const whereSql = effectiveTenantId
    ? sql`WHERE tenant_id = ${effectiveTenantId}::uuid`
    : sql``;

  const result = await db.execute(sql`
    SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
    FROM "monitoramento"."estradas"
    ${whereSql}
  `);

  return result;
}


export async function insertEstradaData(data: NewEstradaData) {
  const [newRecord] = await db
    .insert(estradasInMonitoramento)
    .values({
      nome: data.nome,
      tipo: data.tipo,
      codigo: data.codigo,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: estradasInMonitoramento.id });

  return newRecord;
}