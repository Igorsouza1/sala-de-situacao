import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { resolveScope } from '@/lib/api/scope'
import { layoutBodySchema, layoutQuerySchema } from '@/lib/validations/map-layout'
import { parseLayout } from '@/components/map/helpers/layer-layout'

// A organização que cada pessoa faz das camadas do mapa (pastas, ordem, cor e opacidade), por região (DESIGN.md 13.1 e 13.2).
// É de quem está logado: a linha é sempre a do próprio usuário, nunca a de outra pessoa. Vale a última gravação.
//
//   GET    /api/map/layout?regiao_id=7  → { available, layout, updatedAt }
//   PUT    /api/map/layout              → { updatedAt }   (corpo: { regiao_id?, layout })
//   DELETE /api/map/layout?regiao_id=7  → { ok }          ("Voltar ao padrão")

const NO_STORE = { 'Cache-Control': 'private, no-store' }

// `available: false` não é erro: a pessoa não tem uma região na conta (superadmin, dono sem região) e a organização fica só no aparelho.
const UNAVAILABLE = { available: false, layout: null, updatedAt: null }

export async function GET(request: NextRequest) {
  const query = layoutQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!query.success) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: query.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json(UNAVAILABLE, { headers: NO_STORE })
  try {
    const result = await db.execute<{ layout: unknown; updated_ms: string }>(sql`
      SELECT layout, (extract(epoch FROM updated_at) * 1000)::bigint::text AS updated_ms
      FROM monitoramento.user_map_layouts
      WHERE user_id = ${scope.user.id}::uuid AND regiao_id = ${scope.regiaoId}
    `)
    const row = result.rows[0]
    const layout = row ? (parseLayout(row.layout) ?? null) : null
    return NextResponse.json(
      { available: true, layout, updatedAt: row && layout ? Number(row.updated_ms) : null },
      { headers: NO_STORE },
    )
  } catch (error) {
    console.error('Erro ao ler a organização das camadas:', error)
    return NextResponse.json({ error: 'Não foi possível carregar a organização das camadas.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const body = layoutBodySchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  const layout = parseLayout(body.data.layout)
  if (!layout) return NextResponse.json({ error: 'Organização inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: body.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json({ error: 'Selecione uma Região.' }, { status: 400 })
  try {
    const result = await db.execute<{ updated_ms: string }>(sql`
      INSERT INTO monitoramento.user_map_layouts (user_id, regiao_id, layout, updated_at)
      VALUES (${scope.user.id}::uuid, ${scope.regiaoId}, ${JSON.stringify(layout)}::jsonb, now())
      ON CONFLICT (user_id, regiao_id)
      DO UPDATE SET layout = EXCLUDED.layout, updated_at = EXCLUDED.updated_at
      RETURNING (extract(epoch FROM updated_at) * 1000)::bigint::text AS updated_ms
    `)
    return NextResponse.json({ updatedAt: Number(result.rows[0].updated_ms) }, { headers: NO_STORE })
  } catch (error) {
    console.error('Erro ao guardar a organização das camadas:', error)
    return NextResponse.json({ error: 'Não foi possível guardar a organização das camadas.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const query = layoutQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
  if (!query.success) return NextResponse.json({ error: 'Consulta inválida.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: query.data.regiao_id })
  if (scope.response) return scope.response
  if (!scope.regiaoId) return NextResponse.json({ ok: true }, { headers: NO_STORE })
  try {
    await db.execute(sql`
      DELETE FROM monitoramento.user_map_layouts
      WHERE user_id = ${scope.user.id}::uuid AND regiao_id = ${scope.regiaoId}
    `)
    return NextResponse.json({ ok: true }, { headers: NO_STORE })
  } catch (error) {
    console.error('Erro ao apagar a organização das camadas:', error)
    return NextResponse.json({ error: 'Não foi possível voltar ao padrão.' }, { status: 500 })
  }
}
