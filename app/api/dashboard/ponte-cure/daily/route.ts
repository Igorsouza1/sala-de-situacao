import { NextResponse } from "next/server"
import { db } from "@/db"
import { ponteDoCureInRioDaPrata } from "@/db/schema"
import { and, gte, lte } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const conditions = [] as any[]
  if (startDate) {
    conditions.push(gte(ponteDoCureInRioDaPrata.data, startDate))
  }
  if (endDate) {
    conditions.push(lte(ponteDoCureInRioDaPrata.data, endDate))
  }

  try {
    const query = db
      .select({
        id: ponteDoCureInRioDaPrata.id,
        local: ponteDoCureInRioDaPrata.local,
        data: ponteDoCureInRioDaPrata.data,
        chuva: ponteDoCureInRioDaPrata.chuva,
        nivel: ponteDoCureInRioDaPrata.nivel,
        visibilidade: ponteDoCureInRioDaPrata.visibilidade,
      })
      .from(ponteDoCureInRioDaPrata)

    if (conditions.length > 0) {
      query.where(and(...conditions))
    }

    const result = await query.execute()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar dados diários da Ponte do Cure:", error)
    return NextResponse.json(
      { error: "Falha ao obter os dados diários da Ponte do Cure" },
      { status: 500 },
    )
  }
}
