import { format } from 'date-fns'

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
