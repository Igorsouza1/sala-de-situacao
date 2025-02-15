import { NextResponse } from "next/server"
import { db } from "@/db"
import { ponteDoCureInRioDaPrata } from "@/db/schema"

interface MonthData {
  chuva: number
  nivel: number[]
  visibilidade: {
    cristalino: number
    turvo: number
    muitoTurvo: number
  }
}

export async function GET() {
  try {
    const result = await db
      .select({
        mes: ponteDoCureInRioDaPrata.mes,
        data: ponteDoCureInRioDaPrata.data,
        chuva: ponteDoCureInRioDaPrata.chuva,
        nivel: ponteDoCureInRioDaPrata.nivel,
        visibilidade: ponteDoCureInRioDaPrata.visibilidade,
      })
      .from(ponteDoCureInRioDaPrata)
      .execute()

    const groupedData = result.reduce(
      (acc, item) => {
        if (item.data) {
          const date = new Date(item.data)
          const year = date.getFullYear()
          const month = date.getMonth()

          if (!acc[year]) {
            acc[year] = Array(12)
              .fill(null)
              .map(
                () =>
                  ({
                    chuva: 0,
                    nivel: [],
                    visibilidade: { cristalino: 0, turvo: 0, muitoTurvo: 0 },
                  }) as MonthData,
              )
          }

          if (item.chuva !== null) {
            acc[year][month].chuva += Number(item.chuva)
          }

          if (item.nivel !== null) {
            acc[year][month].nivel.push(Number(item.nivel))
          }

          if (item.visibilidade !== null) {
            switch (item.visibilidade.toLowerCase()) {
              case "cristalino":
                acc[year][month].visibilidade.cristalino++
                break
              case "turvo":
                acc[year][month].visibilidade.turvo++
                break
              case "muito turvo":
                acc[year][month].visibilidade.muitoTurvo++
                break
            }
          }
        }

        return acc
      },
      {} as Record<number, MonthData[]>,
    )

    // Calcular média do nível
    Object.values(groupedData).forEach((yearData) => {
      yearData.forEach((monthData) => {
        if (monthData.nivel.length > 0) {
          const avgNivel = monthData.nivel.reduce((sum, val) => sum + val, 0) / monthData.nivel.length
          monthData.nivel = [avgNivel]
        }
      })
    })

    return NextResponse.json(groupedData)
  } catch (error) {
    console.error("Erro ao buscar dados da Ponte do Cure:", error)
    return NextResponse.json({ error: "Falha ao obter os dados da Ponte do Cure" }, { status: 500 })
  }
}

