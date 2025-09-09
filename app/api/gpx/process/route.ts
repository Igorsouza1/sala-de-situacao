import { NextRequest, NextResponse } from "next/server"
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson"
import { DOMParser } from "@xmldom/xmldom"
import type { FeatureCollection, Geometry, Point, Feature } from "geojson"

export const dynamic = "force-dynamic"

function isPoint(g: Geometry): g is Point {
  return g.type === "Point"
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const xml = new DOMParser().parseFromString(buffer.toString(), "text/xml")

    const geojson = gpxToGeoJSON(xml) as FeatureCollection<Geometry, any>

    // Extrair waypoints (Point)
    const waypoints = geojson.features
      .filter((f): f is Feature<Point> => isPoint(f.geometry))
      .map((f) => {
        const [lon, lat, elevation] = f.geometry.coordinates
        return {
          name: (f.properties?.name as string) ?? "",
          lat,
          lon,
          elevation: elevation ?? null,
        }
      })

    return NextResponse.json({ waypoints }, { status: 200 })
  } catch (err) {
    console.error("[GPX PROCESS ERROR]", err)
    return NextResponse.json({ error: "Erro ao processar GPX" }, { status: 500 })
  }
}
