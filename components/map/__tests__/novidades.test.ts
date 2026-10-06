import { newsItems, readSeen, sinceText, totalNews, writeSeen } from '../helpers/novidades'
import type { Novidades } from '@/types/map-novidades'

// o jest roda em ambiente node: um localStorage de mentira basta para o marcador
function fakeStorage() {
  const data = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => { data.set(k, v) },
  }
  return data
}

const news = (focos: number, desmatamento: number, acoes: number): Novidades => ({
  now: '2026-10-06T12:00:00.000Z',
  acoesMaxId: 10,
  focos: { count: focos, ids: ['a'] },
  desmatamento: { count: desmatamento, ids: [] },
  acoes: { count: acoes, ids: ['1'] },
})

describe('marcador de visto', () => {
  it('guarda e lê por região', () => {
    fakeStorage()
    writeSeen(7, { at: '2026-10-05T10:00:00.000Z', acoes: 5 })
    expect(readSeen(7)).toEqual({ at: '2026-10-05T10:00:00.000Z', acoes: 5 })
    expect(readSeen(8)).toBeNull()
  })
  it('a primeira visita não tem marcador', () => {
    fakeStorage()
    expect(readSeen(undefined)).toBeNull()
  })
  it('valor estranho vira "nunca viu"', () => {
    const data = fakeStorage()
    data.set('prisma:mapa:regiao:7:novidades', '{"at":"ontem","acoes":"x"}')
    expect(readSeen(7)).toBeNull()
    data.set('prisma:mapa:regiao:7:novidades', 'não é json')
    expect(readSeen(7)).toBeNull()
  })
})

describe('newsItems', () => {
  it('só o que tem novidade, fogo primeiro', () => {
    const items = newsItems(news(12, 0, 2))
    expect(items.map((i) => i.kind)).toEqual(['focos', 'acoes'])
    expect(items.map((i) => i.phrase)).toEqual(['12 focos de calor novos', '2 ações novas'])
  })
  it('singular e plural', () => {
    expect(newsItems(news(1, 1, 1)).map((i) => i.phrase)).toEqual(['1 foco de calor novo', '1 alerta de desmatamento', '1 ação nova'])
  })
  it('cada item sabe a camada onde aparece', () => {
    expect(newsItems(news(1, 1, 1)).map((i) => i.slug)).toEqual(['raw_firms', 'desmatamento', 'acoes'])
  })
  it('sem novidade, nada', () => {
    expect(newsItems(null)).toEqual([])
    expect(newsItems(news(0, 0, 0))).toEqual([])
  })
  it('soma o total', () => {
    expect(totalNews(newsItems(news(12, 1, 2)))).toBe(15)
  })
})

describe('sinceText', () => {
  it('dia, mês e hora, sem ano nem segundos', () => {
    expect(sinceText('2026-10-02T14:32:00')).toBe('02/10 às 14:32')
  })
  it('data ruim ou ausente não vira texto', () => {
    expect(sinceText('ontem')).toBeNull()
    expect(sinceText(null)).toBeNull()
  })
})
