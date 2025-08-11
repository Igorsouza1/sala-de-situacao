import { db } from "@/db"



export async function findAllExpedicoesData(){
    const [trilhas, waypoints] = await Promise.all([
        db.execute(`
          SELECT id, nome, data_inicio, data_fim, duracao_minutos, ST_AsGeoJSON(geom) as geojson
          FROM "rio_da_prata"."trilhas"
        `),
        db.execute(`
          SELECT w.id, w.trilha_id, w.nome, w.ele, w.recordedat, t.nome as trilha_nome, ST_AsGeoJSON(w.geom) as geojson
          FROM "rio_da_prata"."waypoints" w
          JOIN "rio_da_prata"."trilhas" t ON w.trilha_id = t.id
        `),
      ])

    return {
        trilhas: trilhas.rows,
        waypoints: waypoints.rows,
    }
}