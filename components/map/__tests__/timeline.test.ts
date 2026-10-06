import { countText, datesOf, defaultSource, fillMonths, indexAt, monthOf, phrase, rangeOf, selectionOf, yearTicks } from '../helpers/timeline'

const now = new Date(2026, 5, 15) // junho de 2026

describe('fillMonths', () => {
  it('uma barra por mês, do primeiro com dado até agora, com zero nos meses vazios', () => {
    const bars = fillMonths([{ mes: '2026-03', n: 30 }, { mes: '2026-01', n: 2 }], now)
    expect(bars.map((b) => b.mes)).toEqual(['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'])
    expect(bars.map((b) => b.n)).toEqual([2, 0, 30, 0, 0, 0])
  })
  it('atravessa a virada do ano', () => {
    const bars = fillMonths([{ mes: '2025-11', n: 1 }], new Date(2026, 1, 1))
    expect(bars.map((b) => b.mes)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })
  it('sem dado, sem barras', () => {
    expect(fillMonths([], now)).toEqual([])
  })
  it('o dado depois de "agora" (relógio atrasado) não é cortado', () => {
    const bars = fillMonths([{ mes: '2026-08', n: 5 }], now)
    expect(bars.at(-1)?.mes).toBe('2026-08')
  })
})

describe('indexAt', () => {
  it('converte o pixel na barra', () => {
    expect(indexAt(0, 100, 10)).toBe(0)
    expect(indexAt(55, 100, 10)).toBe(5)
    expect(indexAt(99, 100, 10)).toBe(9)
  })
  it('fora das bordas vale a barra da ponta', () => {
    expect(indexAt(-20, 100, 10)).toBe(0)
    expect(indexAt(250, 100, 10)).toBe(9)
  })
  it('sem barras ou sem largura, zero', () => {
    expect(indexAt(5, 100, 0)).toBe(0)
    expect(indexAt(5, 0, 10)).toBe(0)
  })
})

describe('rangeOf', () => {
  it('arrastar para a esquerda dá a mesma faixa que para a direita', () => {
    expect(rangeOf(2, 7)).toEqual([2, 7])
    expect(rangeOf(7, 2)).toEqual([2, 7])
    expect(rangeOf(4, 4)).toEqual([4, 4])
  })
})

describe('datesOf e selectionOf', () => {
  const bars = fillMonths([{ mes: '2026-01', n: 1 }], now)
  it('do primeiro dia do primeiro mês ao último instante do último', () => {
    const [start, end] = datesOf(bars, 1, 2)
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 1, 1])
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([2026, 2, 31, 23, 59])
  })
  it('fevereiro termina no 28 ou 29, conforme o ano', () => {
    const [, end] = datesOf(bars, 1, 1)
    expect(end.getDate()).toBe(28)
  })
  it('o filtro de agora volta a ser a faixa de barras', () => {
    const [start, end] = datesOf(bars, 1, 3)
    expect(selectionOf(bars, start, end)).toEqual([1, 3])
  })
  it('um atalho como "Hoje" marca o mês dele', () => {
    expect(selectionOf(bars, new Date(2026, 5, 10), new Date(2026, 5, 10, 23, 59))).toEqual([5, 5])
  })
  it('sem filtro, nenhuma faixa', () => {
    expect(selectionOf(bars, null, null)).toBeNull()
  })
  it('um filtro fora do gráfico não marca nada', () => {
    expect(selectionOf(bars, new Date(2030, 0, 1), new Date(2030, 1, 1))).toBeNull()
  })
})

describe('phrase e countText', () => {
  const bars = fillMonths([{ mes: '2026-03', n: 30 }, { mes: '2026-04', n: 17 }], now)
  it('um mês', () => {
    expect(phrase(bars, 'acoes', 0, 0)).toBe('Março de 2026: 30 ações')
  })
  it('uma faixa soma o que há nela', () => {
    expect(phrase(bars, 'focos', 0, 1)).toBe('De março de 2026 a abril de 2026: 47 focos de calor')
  })
  it('singular e plural, e milhar', () => {
    expect(countText('focos', 1)).toBe('1 foco de calor')
    expect(countText('desmatamento', 1)).toBe('1 alerta de desmatamento')
    expect(countText('acoes', 0)).toBe('0 ações')
    expect(countText('focos', 2041)).toBe('2.041 focos de calor')
  })
})

describe('defaultSource', () => {
  it('a de mais atividade nos últimos 12 meses', () => {
    const data = { focos: [{ mes: '2019-01', n: 900 }], desmatamento: [{ mes: '2026-03', n: 4 }], acoes: [{ mes: '2026-02', n: 9 }] }
    expect(defaultSource(data, now)).toBe('acoes')
  })
  it('empate fica com os focos', () => {
    expect(defaultSource({ focos: [], desmatamento: [], acoes: [] }, now)).toBe('focos')
  })
})

describe('yearTicks e monthOf', () => {
  it('marca o primeiro janeiro de cada ano', () => {
    const bars = fillMonths([{ mes: '2025-11', n: 1 }], new Date(2027, 1, 1))
    expect(yearTicks(bars).map((t) => t.year)).toEqual([2026, 2027])
  })
  it('monthOf usa o mês local', () => {
    expect(monthOf(new Date(2026, 0, 31, 23, 59))).toBe('2026-01')
  })
})
