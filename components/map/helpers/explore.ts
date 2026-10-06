import type { ConsultaBounds, ConsultaItem, ConsultaKind } from '@/types/map-consulta'
import { tidyText } from './text'

// Textos e parâmetros do painel Explorar (DESIGN.md 13.5). Tudo o que vem de gente passa por tidyText (6.2, regra 11).

/** dd/mm/aaaa: o banco já manda pronto; sem ele, lê a data bruta */
export function dateText(item: Pick<ConsultaItem, 'data' | 'data_texto'>): string | null {
  if (item.data_texto) return item.data_texto
  if (!item.data) return null
  const iso = item.data.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : null
}

/** municípios sem repetir, em uma frase ("Bonito · Jardim") */
export function placeText(item: Pick<ConsultaItem, 'municipio' | 'propriedades'>): string {
  const names = item.municipio ? [item.municipio] : (item.propriedades ?? []).map((p) => p.municipio).filter((m): m is string => !!m)
  return [...new Set(names.map(tidyText))].join(' · ')
}

/** nomes das propriedades sem repetir */
export function propertyNames(item: Pick<ConsultaItem, 'propriedades'>): string[] {
  return [...new Set((item.propriedades ?? []).map((p) => tidyText(p.nome)))]
}

/** a área (eixo temático) é o que o ícone representa; sem ela, a categoria */
export function areaText(item: Pick<ConsultaItem, 'eixo_tematico' | 'categoria'>): string {
  return tidyText(item.eixo_tematico || item.categoria)
}

interface ListQuery {
  kind: ConsultaKind
  query: string
  bounds: ConsultaBounds | null
  regiaoId?: number
  propriedadeId?: number
}

/** a query string da lista; a mesma entrada dá a mesma string (a lista só recarrega quando algo muda de verdade) */
export function listParams({ kind, query, bounds, regiaoId, propriedadeId }: ListQuery): string {
  const params = new URLSearchParams({ kind })
  if (query) params.set('q', query)
  if (regiaoId) params.set('regiao_id', String(regiaoId))
  if (bounds) params.set('bbox', bounds.join(','))
  if (propriedadeId) params.set('propriedade_id', String(propriedadeId))
  return params.toString()
}
