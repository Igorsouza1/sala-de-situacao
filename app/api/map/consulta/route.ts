import { NextRequest, NextResponse } from 'next/server'
import { resolveScope } from '@/lib/api/scope'
import { consultaSchema } from '@/lib/validations/map-consulta'
import { queryMapConsulta, updateMapConsultaItem } from '@/lib/repositories/mapConsultaRepository'
import { consultaEditSchema } from '@/lib/validations/map-consulta-edit'
import { requireWriteRegion } from '@/lib/api/require-write-region'
import { addAcaoUpdate } from '@/lib/service/acoesService'
import { revalidateTag } from 'next/cache'

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

// Edição de um registro aberto no Explorar (ADR 0012). Editor da Região, Owner ou Superadmin; Viewer e Auditor não gravam.
export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = consultaEditSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }, { status: 400 })
  const edit = parsed.data
  if (!Object.keys(edit.fields).length) return NextResponse.json({ error: 'Nada para salvar.' }, { status: 400 })
  const scope = await resolveScope({ regiaoId: edit.regiao_id })
  if (scope.response) return scope.response
  const write = await requireWriteRegion(scope.user, scope.tenantId, String(edit.regiao_id))
  if (write.response) return write.response
  if (edit.kind === 'propriedades' && edit.fields.car !== undefined && scope.user.app_metadata?.is_superadmin !== true) {
    return NextResponse.json({ error: 'Só a equipe técnica altera o número do CAR.' }, { status: 403 })
  }
  try {
    const saved = edit.kind === 'acoes'
      ? await updateMapConsultaItem(scope.tenantId, edit.regiao_id, { kind: 'acoes', id: edit.id, fields: edit.fields })
      : await updateMapConsultaItem(scope.tenantId, edit.regiao_id, { kind: 'propriedades', id: edit.id, fields: edit.fields })
    if (!saved) return NextResponse.json({ error: 'Registro não encontrado nesta Região.' }, { status: 404 })
    if (edit.kind === 'acoes') {
      const { status } = edit.fields
      if (status && saved.previous.status !== status) {
        await addAcaoUpdate(edit.id, { descricao: `Status alterado de "${saved.previous.status || 'Sem status'}" para "${status}"` })
          .catch((cause) => console.error('Erro ao registrar histórico de status:', cause))
      }
      revalidateTag('acoes', { expire: 0 })
    } else {
      revalidateTag(`properties-${edit.regiao_id}`, { expire: 0 })
    }
    const fresh = await queryMapConsulta(scope.tenantId, edit.regiao_id, { kind: edit.kind, id: edit.id, q: '', offset: 0 })
    return NextResponse.json({ item: fresh.items[0] ?? null, previous: saved.previous }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Erro ao editar registro do mapa:', error)
    return NextResponse.json({ error: 'Não conseguimos salvar agora.' }, { status: 500 })
  }
}
