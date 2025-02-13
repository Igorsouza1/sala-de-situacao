import { NextResponse } from "next/server"
import { db } from "@/db"
import { acoesInRioDaPrata } from "@/db/schema"

export async function GET() {
  try {
    const result = await db
      .select({
        id: acoesInRioDaPrata.id,
        name: acoesInRioDaPrata.name,
        latitude: acoesInRioDaPrata.latitude,
        longitude: acoesInRioDaPrata.longitude,
        elevation: acoesInRioDaPrata.elevation,
        time: acoesInRioDaPrata.time,
        descricao: acoesInRioDaPrata.descricao,
        mes: acoesInRioDaPrata.mes,
        atuacao: acoesInRioDaPrata.atuacao,
        acao: acoesInRioDaPrata.acao,
      })
      .from(acoesInRioDaPrata)
      .execute()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar dados de ações:", error)
    return NextResponse.json({ error: "Falha ao obter os dados de ações" }, { status: 500 })
  }
}

