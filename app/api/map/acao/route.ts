import { NextResponse } from "next/server"
import { db } from "@/db"

export async function GET() {
  try {
    const actions = await db.execute(`
      SELECT id, acao, name, descricao, mes, time, ST_AsGeoJSON(geom) as geojson
      FROM "rio_da_prata"."acoes"
    `)

    // Agrupar ações por 'acao'
    const groupedActions = actions.rows.reduce((acc: { [key: string]: any[] }, action: any) => {
      const acao = action.acao
      if (!acc[acao]) {
        acc[acao] = []
      }
      acc[acao].push({
        type: "Feature",
        properties: { 
          id: action.id, 
          acao: action.acao, 
          name: action.name, 
          descricao: action.descricao, 
          mes: action.mes ,
          time: action.time
        },
        geometry: JSON.parse(action.geojson)
      })
      return acc
    }, {})

    // Converter ações agrupadas em GeoJSON FeatureCollections
    const actionsGeoJSON = Object.entries(groupedActions).reduce((acc: { [key: string]: any }, [acao, features]) => {
      acc[acao] = {
        type: "FeatureCollection",
        features: features
      }
      return acc
    }, {})

    return NextResponse.json(actionsGeoJSON)
  } catch (error) {
    console.error("Erro ao buscar ações:", error)
    return NextResponse.json({ error: "Falha ao obter os dados de ações" }, { status: 500 })
  }
}
