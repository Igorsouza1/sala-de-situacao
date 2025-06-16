import { NextResponse } from "next/server"
import { db, sql } from "@/db"
import gpxParse from "gpx-parse/lib/gpx-parse"

const parseGpx = (text: string) =>
  new Promise<any>((resolve, reject) => {
    gpxParse.parseGpx(text, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const force = formData.get("force") === "true"

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const text = await file.text()
    const data = await parseGpx(text)

    if (!data.tracks || data.tracks.length === 0) {
      return NextResponse.json({ error: "Arquivo GPX não contém trilha" }, { status: 400 })
    }

    if ((!data.waypoints || data.waypoints.length === 0) && !force) {
      return NextResponse.json({ error: "no_waypoints" }, { status: 400 })
    }

    const points = data.tracks[0].segments.flat()
    const linestring = `LINESTRING(${points.map((p: any) => `${p.lon} ${p.lat}`).join(",")})`
    const firstTime = points[0]?.time ? new Date(points[0].time).toISOString() : null
    const baseName = file.name.replace(/\.gpx$/i, "")
    const nome = firstTime ? `${baseName}-${firstTime.split("T")[0]}` : baseName

    const trilhaResult = await db.execute(sql`
      INSERT INTO rio_da_prata.trilhas (nome, geom, data)
      VALUES (${nome}, ST_SetSRID(ST_GeomFromText(${linestring}), 4326), ${firstTime})
      RETURNING id
    `)

    const trilhaId = trilhaResult.rows[0].id

    if (data.waypoints && data.waypoints.length > 0) {
      for (const w of data.waypoints) {
        const time = w.time ? new Date(w.time).toISOString() : null
        await db.execute(sql`
          INSERT INTO rio_da_prata.waypoints (trilha_id, nome, geom, ele, recorded_at)
          VALUES (
            ${trilhaId},
            ${w.name ?? null},
            ST_SetSRID(ST_MakePoint(${w.lon}, ${w.lat}), 4326),
            ${w.elevation ?? null},
            ${time}
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
