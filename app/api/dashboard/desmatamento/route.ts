import { NextResponse } from "next/server"
import { db } from "@/db"
import { desmatamentoInRioDaPrata } from "@/db/schema"

export async function GET() {
  try {
    const result = await db
      .select({
        alertid: desmatamentoInRioDaPrata.alertid,
        alertha: desmatamentoInRioDaPrata.alertha,
        detectat: desmatamentoInRioDaPrata.detectat,
        detectyear: desmatamentoInRioDaPrata.detectyear,
        state: desmatamentoInRioDaPrata.state,
        stateha: desmatamentoInRioDaPrata.stateha,
      })
      .from(desmatamentoInRioDaPrata)
      .execute()

    // Agrupar os dados por mês e ano
    const groupedData = result.reduce(
      (acc, item) => {
        if (item.detectat) {
          const date = new Date(item.detectat)
          const year = date.getFullYear()
          const month = date.getMonth()

          if (!acc[year]) {
            acc[year] = Array(12).fill(0)
          }

          acc[year][month] += Number(item.alertha) || 0
        }
        return acc
      },
      {} as Record<number, number[]>,
    )

    return NextResponse.json(groupedData)
  } catch (error) {
    console.error("Erro ao buscar dados de desmatamento:", error)
    return NextResponse.json({ error: "Falha ao obter os dados de desmatamento" }, { status: 500 })
  }
}

