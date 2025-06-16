import { NextResponse } from "next/server"
import { db } from "@/db"
import { ponteDoCureInRioDaPrata } from "@/db/schema"
import { and, gte, lte, inArray, desc, asc } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    let dataFiltro: string[] = []

    if (!startDate && !endDate) {
      const dias = await db
        .selectDistinct({ data: ponteDoCureInRioDaPrata.data })
        .from(ponteDoCureInRioDaPrata)
        .orderBy(desc(ponteDoCureInRioDaPrata.data))
        .limit(30)

      dataFiltro = dias
        .map((d) => d.data)
        .filter((d): d is string => !!d)
    }

    const conditions = [] as any[]

    if (startDate) {
      conditions.push(gte(ponteDoCureInRioDaPrata.data, startDate))
    }

    if (endDate) {
      conditions.push(lte(ponteDoCureInRioDaPrata.data, endDate))
    }

    if (!startDate && !endDate && dataFiltro.length > 0) {
      conditions.push(inArray(ponteDoCureInRioDaPrata.data, dataFiltro))
    }

    const result = await db
      .select({
        id: ponteDoCureInRioDaPrata.id,
        local: ponteDoCureInRioDaPrata.local,
        data: ponteDoCureInRioDaPrata.data,
        chuva: ponteDoCureInRioDaPrata.chuva,
        nivel: ponteDoCureInRioDaPrata.nivel,
        visibilidade: ponteDoCureInRioDaPrata.visibilidade,
      })
      .from(ponteDoCureInRioDaPrata)
      .where(and(...conditions))
      .orderBy(asc(ponteDoCureInRioDaPrata.data))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar dados diários da Ponte do Cure:", error)
    return NextResponse.json(
      { error: "Falha ao obter os dados diários da Ponte do Cure" },
      { status: 500 }
    )
  }
}
