import { NextResponse } from "next/server"
import { db } from "@/db"
import { sql } from "drizzle-orm"
import { acoesInRioDaPrata } from "@/db/schema"

export async function GET() {
  try {
    const result = await db
      .select({
        acao: acoesInRioDaPrata.acao,
        valor: sql<number>`COUNT(*)`.as("count"),
      })
      .from(acoesInRioDaPrata)
      .groupBy(acoesInRioDaPrata.acao)
      .execute()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar dados de ações:", error)
    return NextResponse.json({ error: "Falha ao obter os dados de ações" }, { status: 500 })
  }
}

