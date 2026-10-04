import { db, sql } from "@/db"
import { NewTrilhaData, trilhasInMonitoramento, waypointsInMonitoramento, NewWaypointData } from "@/db/schema";



export async function findAllExpedicoesData(tenantId: string, isSuperadmin = false, regionIds: number[] | null = null) {
  if (!tenantId) throw new Error("tenantId é obrigatório para consultar expedições");
  const regionScope = (column: "regiao_id" | "t.regiao_id" | "w.regiao_id") => regionIds === null
    ? sql``
    : regionIds.length
      ? sql`AND ${sql.raw(column)} IN (${sql.join(regionIds.map((id) => sql`${id}`), sql`, `)})`
      : sql`AND FALSE`;
  const [trilhas, waypoints] = await Promise.all([
    db.execute(sql`
          SELECT id, nome, data_inicio, data_fim, duracao_minutos, ST_AsGeoJSON(geom) as geojson
          FROM monitoramento.trilhas
          WHERE ${isSuperadmin ? sql`TRUE` : sql`tenant_id = ${tenantId}::uuid`}
          ${isSuperadmin ? sql`` : regionScope("regiao_id")}
        `),
    db.execute(sql`
          SELECT w.id, w.trilha_id, w.nome, w.ele, w.recordedat, t.nome as trilha_nome, ST_AsGeoJSON(w.geom) as geojson
          FROM monitoramento.waypoints w
          JOIN monitoramento.trilhas t ON w.trilha_id = t.id AND w.tenant_id = t.tenant_id
          WHERE ${isSuperadmin ? sql`TRUE` : sql`w.tenant_id = ${tenantId}::uuid`}
            ${isSuperadmin ? sql`` : sql`AND t.regiao_id = w.regiao_id`}
            ${isSuperadmin ? sql`` : regionScope("w.regiao_id")}
        `),
  ])

  return {
    trilhas: trilhas.rows,
    waypoints: waypoints.rows,
  }
}


export async function insertTrilhaData(data: NewTrilhaData) {
  if (!data.tenantId) throw new Error("tenantId é obrigatório para criar trilha");
  const [newRecord] = await db
    .insert(trilhasInMonitoramento)
    .values({
      nome: data.nome,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      duracaoMinutos: data.duracaoMinutos,
      regiaoId: data.regiaoId,
      tenantId: data.tenantId,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: trilhasInMonitoramento.id });

  return newRecord;
}


export async function insertWaypointDataInWaypointsTable(data: NewWaypointData) {
  if (!data.tenantId) throw new Error("tenantId é obrigatório para criar waypoint");
  const [newRecord] = await db
    .insert(waypointsInMonitoramento)
    .values({
      trilhaId: data.trilhaId,
      nome: data.nome,
      ele: data.ele,
      recordedat: data.recordedat,
      regiaoId: data.regiaoId,
      tenantId: data.tenantId,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: waypointsInMonitoramento.id });
  return newRecord;
}

