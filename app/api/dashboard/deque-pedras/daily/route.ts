import { NextResponse } from "next/server"
import { db } from "@/db"
import { dequeDePedrasInRioDaPrata } from "@/db/schema"
import { and, gte, lte } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const conditions = [] as any[]
  if (startDate) {
    conditions.push(gte(dequeDePedrasInRioDaPrata.data, startDate))
  }
  if (endDate) {
    conditions.push(lte(dequeDePedrasInRioDaPrata.data, endDate))
  }

  try {
    const query = db
      .select({
        id: dequeDePedrasInRioDaPrata.id,
        local: dequeDePedrasInRioDaPrata.local,
        data: dequeDePedrasInRioDaPrata.data,
        turbidez: dequeDePedrasInRioDaPrata.turbidez,
        secchiVertical: dequeDePedrasInRioDaPrata.secchiVertical,
        secchiHorizontal: dequeDePedrasInRioDaPrata.secchiHorizontal,
        chuva: dequeDePedrasInRioDaPrata.chuva,
      })
      .from(dequeDePedrasInRioDaPrata)

    if (conditions.length > 0) {
      query.where(and(...conditions))
    }

    const result = await query.execute()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar dados di\u00e1rios do Deque de Pedras:", error)
    return NextResponse.json(
      { error: "Falha ao obter os dados di\u00e1rios do Deque de Pedras" },
      { status: 500 },
    )
  }
}