import type { ConsultaItem, ConsultaKind } from '@/types/map-consulta'
import { GENERIC_OPEN_ERROR, describeFailure } from './network'

// Edição de um registro no Explorar (DESIGN.md 13.5, ADR 0012): o que o formulário começa mostrando, o que mudou de verdade e o envio.

export type EditDraft = Record<string, string>
export const ACAO_FIELDS = ['nome', 'descricao', 'status', 'categoria'] as const
export const PROPRIEDADE_FIELDS = ['nome', 'titular', 'municipio', 'car'] as const

/** o valor que cada campo tem hoje; vazio vira "" para o campo de texto nunca ficar sem valor */
export function initialDraft(item: ConsultaItem, kind: ConsultaKind): EditDraft {
  if (kind === 'acoes') {
    return { nome: item.nome_registrado ?? '', descricao: item.descricao ?? '', status: item.status ?? '', categoria: item.categoria ?? '' }
  }
  return { nome: item.nome_registrado ?? '', titular: item.titular ?? '', municipio: item.municipio ?? '', car: item.car ?? '' }
}

/** só o que mudou, com os espaços das pontas já tirados; vazio vai como null (limpar o campo) */
export function changedFields(initial: EditDraft, draft: EditDraft): Record<string, string | null> {
  const out: Record<string, string | null> = {}
  for (const key of Object.keys(draft)) {
    const next = draft[key].trim()
    if (next === (initial[key] ?? '').trim()) continue
    out[key] = next === '' ? null : next
  }
  return out
}

export interface EditResult { item: ConsultaItem | null; previous: Record<string, string | null> }

/** grava; em falha, lança uma frase de quem usa (sem o texto cru do navegador) */
export async function saveConsultaEdit(kind: ConsultaKind, id: number, regiaoId: number, fields: Record<string, string | null>): Promise<EditResult> {
  try {
    const response = await fetch('/api/map/consulta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id, regiao_id: regiaoId, fields }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : GENERIC_OPEN_ERROR)
    return { item: data.item ?? null, previous: data.previous ?? {} }
  } catch (cause) {
    const failure = describeFailure(cause)
    throw new Error(failure.offline ? 'Parece que você está sem conexão. O que você escreveu continua aqui.' : failure.message ?? 'Não conseguimos salvar agora.')
  }
}
