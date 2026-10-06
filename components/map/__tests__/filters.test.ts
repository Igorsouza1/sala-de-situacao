import { activeFilterCount, datesFromIntent, filterSummary, intentFromDates, yearRange } from '../helpers/filters'

const jan = new Date(2026, 0, 1)
const dez = new Date(2026, 11, 31)

describe('activeFilterCount', () => {
  it('conta período e tamanho como um filtro cada', () => {
    expect(activeFilterCount(null, null, {})).toBe(0)
    expect(activeFilterCount(jan, dez, {})).toBe(1)
    expect(activeFilterCount(null, null, { minArea: 0 })).toBe(1) // zero hectare ainda é um filtro
    expect(activeFilterCount(jan, null, { maxArea: 50 })).toBe(2)
  })
})

describe('filterSummary', () => {
  it('sem filtro, diz que mostra tudo', () => {
    expect(filterSummary(null, null, {})).toBe('Sem filtros: o mapa mostra tudo.')
  })

  it('junta período e tamanho numa frase só', () => {
    expect(filterSummary(jan, dez, { minArea: 100, maxArea: 500 })).toBe('Mostrando de 01/01/2026 a 31/12/2026 · propriedades de 100 a 500 ha.')
  })

  it('aceita só um lado de cada filtro', () => {
    expect(filterSummary(jan, null, { minArea: 100 })).toBe('Mostrando a partir de 01/01/2026 · propriedades a partir de 100 ha.')
    expect(filterSummary(null, dez, { maxArea: 50 })).toBe('Mostrando até 31/12/2026 · propriedades até 50 ha.')
  })
})

describe('intenção do período', () => {
  // quarta-feira, 7 de outubro de 2026
  const now = new Date(2026, 9, 7, 15, 30)

  it('reconhece os atalhos e os anos pelas datas', () => {
    const [ms, me] = datesFromIntent({ kind: 'preset', id: 'month' }, now)
    expect(intentFromDates(ms, me, now)).toEqual({ kind: 'preset', id: 'month' })
    const [ys, ye] = yearRange(2024)
    expect(intentFromDates(ys, ye, now)).toEqual({ kind: 'year', year: 2024 })
    expect(intentFromDates(null, null, now)).toEqual({ kind: 'none' })
  })

  it('o ano atual é o atalho "Este ano", não um ano avulso', () => {
    const [s, e] = yearRange(2026)
    expect(intentFromDates(s, e, now)).toEqual({ kind: 'preset', id: 'year' })
  })

  it('"Hoje" salvo reabre no dia da abertura, não no dia em que foi escolhido', () => {
    const intent = intentFromDates(...(datesFromIntent({ kind: 'preset', id: 'today' }, now) as [Date, Date]), now)
    expect(intent).toEqual({ kind: 'preset', id: 'today' })
    const nextWeek = new Date(2026, 9, 14, 9, 0)
    const [s, e] = datesFromIntent(intent, nextWeek)
    expect(s!.getDate()).toBe(14)
    expect(e!.getDate()).toBe(14)
  })

  it('intervalo livre guarda as datas exatas e volta igual', () => {
    const start = new Date(2026, 2, 3)
    const end = new Date(2026, 4, 20)
    const intent = intentFromDates(start, end, now)
    expect(intent.kind).toBe('range')
    const [s, e] = datesFromIntent(intent, now)
    expect(s!.getTime()).toBe(start.getTime())
    expect(e!.getTime()).toBe(end.getTime())
  })

  it('um lado só também é um intervalo', () => {
    const intent = intentFromDates(new Date(2026, 0, 10), null, now)
    expect(intent.kind).toBe('range')
    expect(datesFromIntent(intent, now)[1]).toBeNull()
  })
})
