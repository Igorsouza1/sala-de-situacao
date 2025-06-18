import { NextResponse } from "next/server"
import { db } from "@/db"

export async function GET() {
  try {
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

    const trilhasGeoJSON = {
      type: "FeatureCollection",
      features: trilhas.rows.map((row: any) => ({
        type: "Feature",
        properties: {
          id: row.id,
          expedicao: row.nome,
          data: row.data_inicio,
          data_fim: row.data_fim,
          duracao: row.duracao_minutos,
        },
        geometry: JSON.parse(row.geojson),
      })),
    }

    const waypointsGeoJSON = {
      type: "FeatureCollection",
      features: waypoints.rows.map((row: any) => ({
        type: "Feature",
        properties: {
          id: row.id,
          trilhaId: row.trilha_id,
          expedicao: row.trilha_nome,
          name: row.nome,
          ele: row.ele,
          data: row.recordedat,
        },
        geometry: JSON.parse(row.geojson),
      })),
    }

    return NextResponse.json({ trilhas: trilhasGeoJSON, waypoints: waypointsGeoJSON })
  } catch (error) {
    console.error("Erro ao buscar expedições:", error)
    return NextResponse.json({ error: "Falha ao obter os dados de expedições" }, { status: 500 })
  }
}