import { NextResponse } from "next/server"
import { db } from "@/db"
import { dequeDePedrasInRioDaPrata } from "@/db/schema"

interface MonthData {
  chuva: number
  turbidez?: number[]
  turbidezMax?: number
  turbidezMin?: number
  turbidezMedia?: number
}

export async function GET() {
  try {
    const result = await db
      .select({
        mes: dequeDePedrasInRioDaPrata.mes,
        data: dequeDePedrasInRioDaPrata.data,
        turbidez: dequeDePedrasInRioDaPrata.turbidez,
        chuva: dequeDePedrasInRioDaPrata.chuva,
      })
      .from(dequeDePedrasInRioDaPrata)
      .execute()

    // Agrupar os dados por mês
    const groupedData = result.reduce(
      (acc, item) => {
        if (item.data) {
          const date = new Date(item.data)
          const year = date.getFullYear()
          const month = date.getMonth()

          if (!acc[year]) {
            acc[year] = Array(12)
              .fill(null)
              .map(() => ({ chuva: 0, turbidez: [] }) as MonthData)
          }

          acc[year][month].chuva += Number(item.chuva) || 0
          if (item.turbidez !== null) {
            acc[year][month].turbidez!.push(Number(item.turbidez))
          }
        }

        return acc
      },
      {} as Record<number, MonthData[]>,
    )

    // Calcular máxima, mínima e média da turbidez
    Object.values(groupedData).forEach((yearData) => {
      yearData.forEach((monthData) => {
        if (monthData.turbidez && monthData.turbidez.length > 0) {
          monthData.turbidezMax = Math.max(...monthData.turbidez)
          monthData.turbidezMin = Math.min(...monthData.turbidez)
          monthData.turbidezMedia = monthData.turbidez.reduce((sum, val) => sum + val, 0) / monthData.turbidez.length
          delete monthData.turbidez // Remove o array original de turbidez
        }
      })
    })

    return NextResponse.json(groupedData)
  } catch (error) {
    console.error("Erro ao buscar dados do Deque de Pedras:", error)
    return NextResponse.json({ error: "Falha ao obter os dados do Deque de Pedras" }, { status: 500 })
  }
}

