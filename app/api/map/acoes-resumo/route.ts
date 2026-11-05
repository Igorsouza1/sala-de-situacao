import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveScope } from '@/lib/api/scope'
import { queryAcoesResumo } from '@/lib/repositories/mapAcoesResumoRepository'

const schema = z.object({ regiao_id: z.coerce.number().int().positive().optional() })

// GET /api/map/acoes-resumo?regiao_id=1 — todas as ações da região, contadas por situação, caráter, área e ano (13.13).
export async function GET(request: NextRequest) {
  const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: parsed.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json({ error: 'Selecione uma Região.' }, { status: 400 })
  try {
    const groups = await queryAcoesResumo(scope.tenantId, scope.regiaoId)
    return NextResponse.json({ groups }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Erro no resumo das ações:', error)
    return NextResponse.json({ error: 'Não foi possível carregar o resumo das ações.' }, { status: 500 })
  }
}
