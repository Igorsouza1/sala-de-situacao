import { endOfDay, endOfMonth, endOfWeek, endOfYear, format, isSameDay, startOfDay, startOfMonth, startOfWeek, startOfYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface AreaFilter {
  minArea?: number
  maxArea?: number
}

// Quantos filtros estão ligados: o dock mostra o número para quem fechou o painel (DESIGN.md 2.1).
export const activeFilterCount = (start: Date | null, end: Date | null, area: AreaFilter) =>
  (start || end ? 1 : 0) + (area.minArea !== undefined || area.maxArea !== undefined ? 1 : 0)

const day = (d: Date) => format(d, 'dd/MM/yyyy')

// A frase que diz o que está valendo, em português corrente.
export function filterSummary(start: Date | null, end: Date | null, area: AreaFilter) {
  const parts: string[] = []
  if (start && end) parts.push(`de ${day(start)} a ${day(end)}`)
  else if (start) parts.push(`a partir de ${day(start)}`)
  else if (end) parts.push(`até ${day(end)}`)
  const { minArea, maxArea } = area
  if (minArea !== undefined && maxArea !== undefined) parts.push(`propriedades de ${minArea} a ${maxArea} ha`)
  else if (minArea !== undefined) parts.push(`propriedades a partir de ${minArea} ha`)
  else if (maxArea !== undefined) parts.push(`propriedades até ${maxArea} ha`)
  return parts.length ? `Mostrando ${parts.join(' · ')}.` : 'Sem filtros: o mapa mostra tudo.'
}

// ── Período ──────────────────────────────────────────────────────────────────
export type DateRange = [Date, Date]
export type PresetId = 'today' | 'week' | 'month' | 'year'

export const DATE_PRESETS: { id: PresetId; label: string; range: (now: Date) => DateRange }[] = [
  { id: 'today', label: 'Hoje', range: (n) => [startOfDay(n), endOfDay(n)] },
  { id: 'week', label: 'Esta semana', range: (n) => [startOfWeek(n, { locale: ptBR }), endOfWeek(n, { locale: ptBR })] },
  { id: 'month', label: 'Este mês', range: (n) => [startOfMonth(n), endOfMonth(n)] },
  { id: 'year', label: 'Este ano', range: (n) => [startOfYear(n), endOfYear(n)] },
]

export const yearRange = (year: number): DateRange => [new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59, 999)]

// O que a pessoa escolheu, e não as datas em que isso caiu: "Hoje" salvo como data abriria, na semana seguinte, mostrando um dia que
// já passou. Atalhos e anos se recalculam a cada abertura; só o intervalo livre fica com as datas exatas que ela digitou.
export type DateIntent =
  | { kind: 'none' }
  | { kind: 'preset'; id: PresetId }
  | { kind: 'year'; year: number }
  | { kind: 'range'; start: string | null; end: string | null }

export function intentFromDates(start: Date | null, end: Date | null, now: Date): DateIntent {
  if (!start && !end) return { kind: 'none' }
  if (start && end) {
    const preset = DATE_PRESETS.find((p) => {
      const [s, e] = p.range(now)
      return isSameDay(start, s) && isSameDay(end, e)
    })
    if (preset) return { kind: 'preset', id: preset.id }
    const year = start.getFullYear()
    const [ys, ye] = yearRange(year)
    if (isSameDay(start, ys) && isSameDay(end, ye)) return { kind: 'year', year }
  }
  return { kind: 'range', start: start ? start.toISOString() : null, end: end ? end.toISOString() : null }
}

export function datesFromIntent(intent: DateIntent, now: Date): [Date | null, Date | null] {
  switch (intent.kind) {
    case 'none':
      return [null, null]
    case 'preset':
      return DATE_PRESETS.find((p) => p.id === intent.id)!.range(now)
    case 'year':
      return yearRange(intent.year)
    case 'range':
      return [intent.start ? new Date(intent.start) : null, intent.end ? new Date(intent.end) : null]
  }
}
