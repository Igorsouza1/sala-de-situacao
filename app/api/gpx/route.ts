import { NextResponse } from "next/server"
import { db, sql } from "@/db"
import { gpx as gpxToGeoJSON } from "@tmcw/togeojson"
import { DOMParser } from "@xmldom/xmldom"

import type {
  FeatureCollection,
  LineString,
  Point,
  Position,
} from "geojson"

// ────── Type Guards ──────
const isLineString = (g: any): g is LineString => g?.type === "LineString"
const isPoint = (g: any): g is Point => g?.type === "Point"

// ────── Converte GeoJSON para MULTILINESTRING Z (WKT) ──────
function toMultiLineStringZ(fc: FeatureCollection): string | null {
  const segments: string[] = []

  for (const feat of fc.features) {
    const geom = feat.geometry
    if (isLineString(geom)) {
      const coords = (geom.coordinates as Position[])
        .map(([lon, lat, ele]) => `${lon} ${lat} ${ele ?? 0}`)
        .join(",")
      segments.push(`(${coords})`)
    }
  }

  return segments.length ? `MULTILINESTRING Z (${segments.join(",")})` : null
}

// ────── POST: Upload de arquivo GPX ──────
export async function POST(request: Request) {
  try {
    // ─── Recebe e valida o arquivo GPX ───
    const form = await request.formData()
    const file = form.get("file")
    if (!(file instanceof File))
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })

    const gpxString = await file.text()
    const xmlDoc = new DOMParser().parseFromString(gpxString, "text/xml")
    const geojson = gpxToGeoJSON(xmlDoc) as FeatureCollection

    // ─── Extrai a trilha principal ───
    const wkt = toMultiLineStringZ(geojson)
    if (!wkt)
      return NextResponse.json({ error: "GPX sem trilhas" }, { status: 400 })

    // ─── Extrai datas dos waypoints ───
    const times: string[] = geojson.features
      .filter(f => isPoint(f.geometry))
      .map(f => f.properties?.time)
      .filter((t): t is string => !!t)
      .sort()

    const dataInicio = times[0] ?? null
    const dataFim = times[times.length - 1] ?? null
    let duracaoMinutos: number | null = null

    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)
      duracaoMinutos = Math.floor((fim.getTime() - inicio.getTime()) / 60000)
    }

    // ─── Insere trilha no banco ───
    const nomeBase = file.name.replace(/\.gpx$/i, "")
    const { rows } = await db.execute(sql`
      INSERT INTO monitoramento.trilhas (nome, geom, data_inicio, data_fim, duracao_minutos)
      VALUES (
        ${nomeBase},
        ST_SetSRID(ST_GeomFromText(${wkt}), 4674),
        ${dataInicio},
        ${dataFim},
        ${duracaoMinutos}
      )
      RETURNING id
    `)
    const trilhaId = rows[0].id as number

    // ─── Insere waypoints individuais ───
    for (const feat of geojson.features) {
      const geom = feat.geometry
      if (isPoint(geom)) {
        const [lon, lat, ele] = geom.coordinates
        await db.execute(sql`
          INSERT INTO monitoramento.waypoints (trilha_id, nome, geom, ele, recordedAt)
          VALUES (
            ${trilhaId},
            ${feat.properties?.name ?? null},
            ST_SetSRID(ST_MakePoint(${lon}, ${lat}, ${ele ?? 0}), 4674),
            ${ele ?? null},
            ${feat.properties?.time ?? null}
          )
        `)
      }
    }

    return NextResponse.json({ success: true, trilhaId })

  } catch (err) {
    console.error("Erro ao processar GPX:", err)
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 })
  }
}
