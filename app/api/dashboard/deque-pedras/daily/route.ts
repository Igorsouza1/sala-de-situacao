import { NextResponse } from "next/server"
import { listarDiario } from "@/lib/repo/deque-pedras"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  try {
    const result = await listarDiario(startDate || undefined, endDate || undefined)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Erro ao buscar dados diários do Deque de Pedras:", error)
    return NextResponse.json(
      { error: "Falha ao obter os dados diários do Deque de Pedras" },
      { status: 500 },
    )
  }
}