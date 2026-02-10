import { db, sql } from "@/db"
import { NewTrilhaData, trilhasInRioDaPrata, waypointsInRioDaPrata, NewWaypointData } from "@/db/schema";



export async function findAllExpedicoesData() {
  const [trilhas, waypoints] = await Promise.all([
    db.execute(`
          SELECT id, nome, data_inicio, data_fim, duracao_minutos, ST_AsGeoJSON(geom) as geojson
          FROM "monitoramento"."trilhas"
        `),
    db.execute(`
          SELECT w.id, w.trilha_id, w.nome, w.ele, w.recordedat, t.nome as trilha_nome, ST_AsGeoJSON(w.geom) as geojson
          FROM "monitoramento"."waypoints" w
          JOIN "monitoramento"."trilhas" t ON w.trilha_id = t.id
        `),
  ])

  return {
    trilhas: trilhas.rows,
    waypoints: waypoints.rows,
  }
}


export async function insertTrilhaData(data: NewTrilhaData) {
  const [newRecord] = await db
    .insert(trilhasInRioDaPrata)
    .values({
      nome: data.nome,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim,
      duracaoMinutos: data.duracaoMinutos,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: trilhasInRioDaPrata.id });

  return newRecord;
}


export async function insertWaypointDataInWaypointsTable(data: NewWaypointData) {
  const [newRecord] = await db
    .insert(waypointsInRioDaPrata)
    .values({
      trilhaId: data.trilhaId,
      nome: data.nome,
      ele: data.ele,
      recordedat: data.recordedat,
      geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4674)`,
    })
    .returning({ id: waypointsInRioDaPrata.id });
  return newRecord;
}

