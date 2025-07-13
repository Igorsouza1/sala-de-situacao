import { NextRequest, NextResponse } from "next/server"
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson"
import { DOMParser } from "@xmldom/xmldom"

export const dynamic = "force-dynamic" // importante para uploads em dev

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const xml = new DOMParser().parseFromString(buffer.toString(), "text/xml")
    const geojson = gpxToGeoJSON(xml)

    // Extrair waypoints (type: Point)
    const waypoints = geojson.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => ({
        name: f.properties?.name || "",
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        elevation: f.geometry.coordinates[2] || null,
      }))

    return NextResponse.json({ waypoints }, { status: 200 })
  } catch (err: any) {
    console.error("[GPX PROCESS ERROR]", err)
    return NextResponse.json({ error: "Erro ao processar GPX" }, { status: 500 })
  }
}
