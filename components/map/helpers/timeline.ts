import type { FonteTempo, LinhaDoTempo, MesContagem } from '@/types/map-linha-do-tempo'

// A linha do tempo do painel Filtros (DESIGN.md 13.9): as contas do histograma, todas puras (pixel, mês, data, frase), para se testar
// sem tela. Um mês é "AAAA-MM"; o gráfico tem uma barra por mês, do primeiro mês com dado até o mês de agora.

export interface Bar {
  mes: string
  n: number
  /** 0 a 11 */
  month: number
  year: number
}

const key = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, '0')}`

/** o mês de uma data, no horário local da pessoa */
export const monthOf = (d: Date) => key(d.getFullYear(), d.getMonth())

/** uma barra por mês, do primeiro mês com dado até `now`; os meses sem nada ficam com 0 para o tempo ser contínuo */
export function fillMonths(series: MesContagem[], now: Date): Bar[] {
  if (series.length === 0) return []
  const counts = new Map(series.map((s) => [s.mes, s.n]))
  const [firstYear, firstMonth] = [...counts.keys()].sort()[0].split('-').map(Number)
  const bars: Bar[] = []
  let year = firstYear
  let month = firstMonth - 1
  const last = monthOf(now)
  // o último mês com dado pode ser depois de "agora" (relógio do aparelho atrasado): o gráfico vai até o que for maior
  const end = [last, ...counts.keys()].sort().at(-1)!
  for (;;) {
    const mes = key(year, month)
    bars.push({ mes, n: counts.get(mes) ?? 0, month, year })
    if (mes >= end) break
    month += 1
    if (month > 11) { month = 0; year += 1 }
  }
  return bars
}

/** qual barra está sob o ponto `x`, num gráfico de `width` pixels com `count` barras; fora das bordas vale a barra da ponta */
export function indexAt(x: number, width: number, count: number): number {
  if (count <= 0 || width <= 0) return 0
  return Math.max(0, Math.min(count - 1, Math.floor((x / width) * count)))
}

/** a faixa de um arrasto, na ordem certa (arrastar para a esquerda dá o mesmo que para a direita) */
export const rangeOf = (a: number, b: number): [number, number] => (a <= b ? [a, b] : [b, a])

/** o intervalo de datas de uma faixa de barras: do primeiro dia do primeiro mês ao último instante do último mês */
export function datesOf(bars: Bar[], from: number, to: number): [Date, Date] {
  const first = bars[from]
  const last = bars[to]
  return [new Date(first.year, first.month, 1, 0, 0, 0, 0), new Date(last.year, last.month + 1, 0, 23, 59, 59, 999)]
}

/** as barras que o filtro de agora toca (do mês da data inicial ao da final); sem filtro, nenhuma. Um atalho como "Hoje" marca o mês dele. */
export function selectionOf(bars: Bar[], start: Date | null, end: Date | null): [number, number] | null {
  if (bars.length === 0 || (!start && !end)) return null
  const from = start ? bars.findIndex((b) => b.mes >= monthOf(start)) : 0
  let to = end ? bars.length - 1 : bars.length - 1
  if (end) {
    const endMonth = monthOf(end)
    for (let i = bars.length - 1; i >= 0; i -= 1) if (bars[i].mes <= endMonth) { to = i; break }
  }
  if (from < 0 || to < from) return null
  return [from, to]
}

const MONTH = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
export const monthName = (bar: Bar) => MONTH.format(new Date(bar.year, bar.month, 1))

const NOUN: Record<FonteTempo, [string, string]> = {
  focos: ['foco de calor', 'focos de calor'],
  desmatamento: ['alerta de desmatamento', 'alertas de desmatamento'],
  acoes: ['ação', 'ações'],
}
export const SOURCE_LABEL: Record<FonteTempo, string> = { focos: 'Focos', desmatamento: 'Desmatamento', acoes: 'Ações' }

export const countText = (source: FonteTempo, n: number) => `${n.toLocaleString('pt-BR')} ${NOUN[source][n === 1 ? 0 : 1]}`

/** a frase do que está à vista: um mês ("março de 2026: 30 ações") ou uma faixa ("De março de 2025 a junho de 2025: 47 focos de calor") */
export function phrase(bars: Bar[], source: FonteTempo, from: number, to: number): string {
  const total = bars.slice(from, to + 1).reduce((sum, b) => sum + b.n, 0)
  if (from === to) return `${capitalize(monthName(bars[from]))}: ${countText(source, total)}`
  return `De ${monthName(bars[from])} a ${monthName(bars[to])}: ${countText(source, total)}`
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** a fonte que abre marcada: a de mais atividade nos últimos 12 meses (empate: focos, depois desmatamento, depois ações) */
export function defaultSource(data: LinhaDoTempo, now: Date): FonteTempo {
  const cutoff = monthOf(new Date(now.getFullYear(), now.getMonth() - 11, 1))
  const recent = (s: MesContagem[]) => s.filter((m) => m.mes >= cutoff).reduce((sum, m) => sum + m.n, 0)
  const order: FonteTempo[] = ['focos', 'desmatamento', 'acoes']
  return order.reduce((best, s) => (recent(data[s]) > recent(data[best]) ? s : best), order[0])
}

/** os anos que ganham marca no eixo: o primeiro janeiro de cada ano (e a primeira barra, se o gráfico não começa em janeiro) */
export const yearTicks = (bars: Bar[]): { index: number; year: number }[] =>
  bars.flatMap((b, index) => (b.month === 0 ? [{ index, year: b.year }] : []))
