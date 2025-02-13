import { NextResponse } from "next/server"
import { db } from "@/db"
import { rawFirmsInRioDaPrata } from "@/db/schema"

export async function GET() {
  try {
    const result = await db
      .select({
        acq_date: rawFirmsInRioDaPrata.acqDate,
        bright_ti4: rawFirmsInRioDaPrata.brightTi4,
        latitude: rawFirmsInRioDaPrata.latitude,
        longitude: rawFirmsInRioDaPrata.longitude,
      })
      .from(rawFirmsInRioDaPrata)
      .execute()

    // Agrupar os dados por mês e ano
    const groupedData = result.reduce(
      (acc, item) => {
        if (item.acq_date) {
          const date = new Date(item.acq_date)
          const year = date.getFullYear()
          const month = date.getMonth()

          if (!acc[year]) {
            acc[year] = Array(12).fill(0)
          }

          acc[year][month]++
        }
        return acc
      },
      {} as Record<number, number[]>,
    )

    return NextResponse.json(groupedData)
  } catch (error) {
    console.error("Erro ao buscar dados de focos de incêndio:", error)
    return NextResponse.json({ error: "Falha ao obter os dados de focos de incêndio" }, { status: 500 })
  }
}

