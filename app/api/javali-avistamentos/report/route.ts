import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { javaliAvistamentosInMonitoramento } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tipo, observacoes, latitude, longitude } = body

  if (!tipo || latitude == null || longitude == null) {
    return NextResponse.json(
      { success: false, error: 'Preencha todos os campos obrigatórios.' },
      { status: 400 }
    )
  }

  const lat = parseFloat(latitude)
  const lng = parseFloat(longitude)

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { success: false, error: 'Coordenadas inválidas.' },
      { status: 400 }
    )
  }

  try {
    await db.insert(javaliAvistamentosInMonitoramento).values({
      tipo,
      observacoes,
      geom: sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4674)`,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving sighting:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao salvar o registro.' },
      { status: 500 }
    )
  }
}
