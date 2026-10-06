import { NextRequest, NextResponse } from 'next/server'
import { resolveScope } from '@/lib/api/scope'
import { novidadesSchema } from '@/lib/validations/map-novidades'
import { queryNovidades } from '@/lib/repositories/mapNovidadesRepository'

// GET /api/map/novidades?regiao_id=7&since=...&acoes_after=123 — o que mudou na região desde a última vez que a pessoa viu (13.8).
export async function GET(request: NextRequest) {
  const parsed = novidadesSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: parsed.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json({ error: 'Selecione uma Região.' }, { status: 400 })
  try {
    const result = await queryNovidades(scope.tenantId, scope.regiaoId, parsed.data)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Erro nas novidades do mapa:', error)
    return NextResponse.json({ error: 'Não foi possível carregar as novidades.' }, { status: 500 })
  }
}
