import { NextResponse } from "next/server"
import { db } from "@/db"

export async function GET() {
  try {
    // Executa a query para buscar todas as estradas com a geometria em formato GeoJSON
    const result = await db.execute(`
      SELECT id, nome, tipo, codigo, ST_AsGeoJSON(geom) as geojson
      FROM "rio_da_prata"."estradas"
    `)

    // Acessa os dados corretamente (result.rows contém o array de registros)
    const estradas = result.rows

    // Converte os dados para GeoJSON
    const geoJson = {
      type: "FeatureCollection",
      features: estradas.map((estrada: any) => ({
        type: "Feature",
        properties: {
          id: estrada.id,
          nome: estrada.nome,
          tipo: estrada.tipo,
          codigo: estrada.codigo,
        },
        geometry: JSON.parse(estrada.geojson), // Converte string para JSON
      })),
    }

    return NextResponse.json(geoJson)
  } catch (error) {
    console.error("Erro ao buscar estradas:", error)
    return NextResponse.json({ error: "Falha ao obter os dados" }, { status: 500 })
  }
}

