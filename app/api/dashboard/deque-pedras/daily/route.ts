import { NextResponse } from "next/server"
import { db } from "@/db"
import { dequeDePedrasInRioDaPrata } from "@/db/schema"
import { and, gte, lte } from "drizzle-orm"
import { apiError } from "@/lib/api/responses"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    let query = db
      .select()
      .from(dequeDePedrasInRioDaPrata).$dynamic()

    if(startDate && endDate){
        query = query.where(and(gte(dequeDePedrasInRioDaPrata.data, startDate), lte(dequeDePedrasInRioDaPrata.data, endDate)))
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