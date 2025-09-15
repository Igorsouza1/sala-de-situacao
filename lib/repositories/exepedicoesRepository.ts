import { db, sql } from "@/db"
import { NewTrilhaData, trilhas, waypoints, NewWaypointData} from "@/db/schema";



export async function findAllExpedicoesData(regiaoId: number){
    const [trilhasResult, waypointsResult] = await Promise.all([
        db.execute(sql`
          SELECT id, nome, data_inicio, data_fim, duracao_minutos, ST_AsGeoJSON(geom) as geojson
          FROM trilhas
          WHERE regiao_id = ${regiaoId}
        `),
        db.execute(sql`
          SELECT w.id, w.trilha_id, w.nome, w.ele, w.recordedat, t.nome as trilha_nome, ST_AsGeoJSON(w.geom) as geojson
          FROM waypoints w
          JOIN trilhas t ON w.trilha_id = t.id
          WHERE t.regiao_id = ${regiaoId}
        `),
      ])

    return {
        trilhas: trilhasResult.rows,
        waypoints: waypointsResult.rows,
    }
}


export async function insertTrilhaData(data: NewTrilhaData){
  const [newRecord] = await db
  .insert(trilhas)
  .values({
    ...data,
    geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4326)`,
  })
  .returning({ id: trilhas.id });

return newRecord;
}


export async function insertWaypointDataInWaypointsTable(data: NewWaypointData){
  const [newRecord] = await db
  .insert(waypoints)
  .values({
    trilhaId: data.trilhaId,
    nome: data.nome,
    ele: data.ele,
    recordedat: data.recordedat,
    geom: sql`ST_SetSRID(ST_GeomFromText(${data.geom}), 4326)`,
  })
  .returning({ id: waypoints.id });
  return newRecord;
}
