import { NextRequest, NextResponse } from 'next/server'
import { resolveScope } from '@/lib/api/scope'
import { consultaSchema } from '@/lib/validations/map-consulta'
import { queryMapConsulta } from '@/lib/repositories/mapConsultaRepository'

export async function GET(request: NextRequest) {
  const parsed = consultaSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!parsed.success) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: parsed.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json({ error: 'Selecione uma Região para consultar.' }, { status: 400 })
  try {
    const result = await queryMapConsulta(scope.tenantId, scope.regiaoId, parsed.data)
    if (parsed.data.id && !result.items.length) return NextResponse.json({ error: 'Registro não encontrado nesta Região.' }, { status: 404 })
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Erro na consulta do mapa:', error)
    return NextResponse.json({ error: 'Não foi possível carregar a consulta.' }, { status: 500 })
  }
}
