import { NextResponse } from "next/server"
import { 
  listarAcoes, 
  buscarAcaoPorId, 
  criarAcao, 
  atualizarAcao, 
  removerAcao,
  buscarAcoesPorStatus,
  buscarAcoesPorTipo 
} from "@/lib/repo/acoes"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const status = searchParams.get("status")
  const tipo = searchParams.get("tipo")

  try {
    if (id) {
      const acao = await buscarAcaoPorId(Number(id))
      if (!acao) {
        return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 })
      }
      return NextResponse.json(acao)
    }

    if (status) {
      const acoes = await buscarAcoesPorStatus(status)
      return NextResponse.json(acoes)
    }

    if (tipo) {
      const acoes = await buscarAcoesPorTipo(tipo)
      return NextResponse.json(acoes)
    }

    const acoes = await listarAcoes()
    return NextResponse.json(acoes)
  } catch (error) {
    console.error("Erro ao buscar ações:", error)
    return NextResponse.json({ error: "Falha ao buscar ações" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const acao = await criarAcao(body)
    return NextResponse.json({ success: true, data: acao })
  } catch (error) {
    console.error("Erro ao criar ação:", error)
    return NextResponse.json({ error: "Falha ao criar ação" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }
    
    const acao = await atualizarAcao(body.id, body)
    return NextResponse.json({ success: true, data: acao })
  } catch (error) {
    console.error("Erro ao atualizar ação:", error)
    return NextResponse.json({ error: "Falha ao atualizar ação" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
    }
    
    const success = await removerAcao(body.id)
    if (!success) {
      return NextResponse.json({ error: "Ação não encontrada" }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao remover ação:", error)
    return NextResponse.json({ error: "Falha ao remover ação" }, { status: 500 })
  }
}
