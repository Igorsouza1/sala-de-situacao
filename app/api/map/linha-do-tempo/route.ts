import { NextRequest, NextResponse } from 'next/server'
import { resolveScope } from '@/lib/api/scope'
import { linhaDoTempoSchema } from '@/lib/validations/map-linha-do-tempo'
import { queryLinhaDoTempo } from '@/lib/repositories/mapLinhaDoTempoRepository'

// GET /api/map/linha-do-tempo?regiao_id=7 — focos, desmatamento e ações por mês na região (13.9).
export async function GET(request: NextRequest) {
  const parsed = linhaDoTempoSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: parsed.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json({ error: 'Selecione uma Região.' }, { status: 400 })
  try {
    const result = await queryLinhaDoTempo(scope.tenantId, scope.regiaoId)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=300' } })
  } catch (error) {
    console.error('Erro na linha do tempo do mapa:', error)
    return NextResponse.json({ error: 'Não foi possível carregar a linha do tempo.' }, { status: 500 })
  }
}
