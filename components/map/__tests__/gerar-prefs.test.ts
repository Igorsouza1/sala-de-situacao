import { clearGerarPrefs, isCustomGerar, readGerarPrefs, saveGerarPrefs } from '../helpers/map-prefs'
import { DEFAULT_SHOW, PART_IDS } from '../helpers/gerar-mapa'

const fakeStore = (initial: Record<string, string> = {}) => {
  const data = { ...initial }
  return {
    data,
    getItem: (k: string) => (k in data ? data[k] : null),
    setItem: (k: string, v: string) => { data[k] = v },
    removeItem: (k: string) => { delete data[k] },
  }
}
const blocked = () => ({ getItem: () => { throw new Error('bloqueado') }, setItem: () => { throw new Error('bloqueado') }, removeItem: () => { throw new Error('bloqueado') } })

describe('preferências do Gerar mapa', () => {
  it('lê de volta o que gravou, e cada parte grava a sua sem apagar a das outras', () => {
    const store = fakeStore()
    saveGerarPrefs({ paper: 'a3', orientation: 'portrait' }, store)
    saveGerarPrefs({ coords: 'utm', legendCorner: 'top-left' }, store)
    saveGerarPrefs({ basemap: 'streets' }, store)
    expect(readGerarPrefs(store)).toEqual({ paper: 'a3', orientation: 'portrait', coords: 'utm', legendCorner: 'top-left', basemap: 'streets' })
  })

  it('lembra o que estava ligado e desligado', () => {
    const store = fakeStore()
    saveGerarPrefs({ show: { ...DEFAULT_SHOW, grid: false, inset: true } }, store)
    const show = readGerarPrefs(store).show!
    expect(show.grid).toBe(false)
    expect(show.inset).toBe(true)
    expect(show.north).toBe(true)
  })

  it('não lembra título nem textos da legenda: esses partem do automático', () => {
    const store = fakeStore()
    saveGerarPrefs({ paper: 'a3', title: 'Meu título', legendEdits: { labels: { a: 'b' } }, note: 'oi' } as any, store)
    const raw = JSON.parse(store.data['prisma:mapa:gerar'])
    expect(raw.title).toBeUndefined()
    expect(raw.legendEdits).toBeUndefined()
    expect(raw.note).toBeUndefined()
  })

  it('sem nada salvo, devolve vazio', () => {
    expect(readGerarPrefs(fakeStore())).toEqual({})
  })

  it('descarta o que está estranho, campo a campo, sem quebrar', () => {
    const store = fakeStore({
      'prisma:mapa:gerar': JSON.stringify({
        v: 1,
        paper: 'a0', // papel que não existe
        orientation: 'portrait',
        basemap: 'osm', // a folha não oferece esta base
        coords: 'utm',
        legendCorner: 'centro',
        show: { north: false, grid: 'sim', inventado: true },
      }),
    })
    expect(readGerarPrefs(store)).toEqual({ orientation: 'portrait', coords: 'utm', show: { north: false } })
  })

  it('versão antiga ou JSON quebrado: nada salvo', () => {
    expect(readGerarPrefs(fakeStore({ 'prisma:mapa:gerar': JSON.stringify({ v: 0, paper: 'a3' }) }))).toEqual({})
    expect(readGerarPrefs(fakeStore({ 'prisma:mapa:gerar': '{quebrado' }))).toEqual({})
  })

  it('sem armazenamento (janela privada, bloqueado): funciona igual, só não lembra', () => {
    expect(() => saveGerarPrefs({ paper: 'a3' }, blocked())).not.toThrow()
    expect(readGerarPrefs(blocked())).toEqual({})
    expect(() => clearGerarPrefs(blocked())).not.toThrow()
    expect(readGerarPrefs(null)).toEqual({})
  })

  it('"voltar ao padrão" apaga tudo', () => {
    const store = fakeStore()
    saveGerarPrefs({ paper: 'a3' }, store)
    clearGerarPrefs(store)
    expect(readGerarPrefs(store)).toEqual({})
  })
})

describe('isCustomGerar', () => {
  it('sem nada, ou igual ao padrão, não é personalizado', () => {
    expect(isCustomGerar({})).toBe(false)
    expect(isCustomGerar({ paper: 'a4', orientation: 'landscape', coords: 'dms', legendCorner: 'bottom-right', show: DEFAULT_SHOW })).toBe(false)
  })

  it('qualquer escolha diferente do padrão é personalizada', () => {
    expect(isCustomGerar({ paper: 'a3' })).toBe(true)
    expect(isCustomGerar({ orientation: 'portrait' })).toBe(true)
    expect(isCustomGerar({ coords: 'utm' })).toBe(true)
    expect(isCustomGerar({ legendCorner: 'top-right' })).toBe(true)
    expect(isCustomGerar({ basemap: 'streets' })).toBe(true)
    expect(isCustomGerar({ show: { ...DEFAULT_SHOW, date: false } })).toBe(true)
  })

  it('a lista de partes do padrão tem todas as partes', () => {
    expect(Object.keys(DEFAULT_SHOW).sort()).toEqual([...PART_IDS].sort())
  })
})

describe('preferências novas do Gerar mapa', () => {
  it('lembra o grau da grade, onde ficam os números, a legenda ao lado e o estilo da seta', () => {
    const store = fakeStore()
    saveGerarPrefs({ gridLevel: 0, gridNumbers: 'inside', legendSide: true, northStyle: 'classic' }, store)
    expect(readGerarPrefs(store)).toEqual({ gridLevel: 0, gridNumbers: 'inside', legendSide: true, northStyle: 'classic' })
  })

  it('grau fora de 0 a 4, estilo ou lugar desconhecido não entram: voltam ao padrão', () => {
    const store = fakeStore({ 'prisma:mapa:gerar': JSON.stringify({ v: 1, gridLevel: 9, gridNumbers: 'fora', northStyle: 'pirata', legendSide: 'sim' }) })
    const prefs = readGerarPrefs(store)
    expect(prefs.gridLevel).toBe(3)
    expect(prefs.gridNumbers).toBeUndefined()
    expect(prefs.northStyle).toBeUndefined()
    expect(prefs.legendSide).toBeUndefined()
  })

  it('o padrão não é personalizado; qualquer um dos novos diferente é', () => {
    expect(isCustomGerar({ gridLevel: 3, gridNumbers: 'margin', legendSide: false, northStyle: 'letter' })).toBe(false)
    expect(isCustomGerar({ gridLevel: 0 })).toBe(true)
    expect(isCustomGerar({ gridNumbers: 'inside' })).toBe(true)
    expect(isCustomGerar({ legendSide: true })).toBe(true)
    expect(isCustomGerar({ northStyle: 'prisma' })).toBe(true)
    expect(isCustomGerar({ northStyle: 'classic' })).toBe(true)
  })

  it('o logo e os textos livres nunca são lembrados', () => {
    const store = fakeStore()
    saveGerarPrefs({ paper: 'a3', logoUrl: 'data:image/png;base64,AAAA', notes: { title: 'a', map: 'b', side: 'c' } } as any, store)
    const raw = JSON.parse(store.data['prisma:mapa:gerar'])
    expect(raw.logoUrl).toBeUndefined()
    expect(raw.notes).toBeUndefined()
  })
})

describe('itens tirados da legenda', () => {
  it('voltam tirados da próxima vez', () => {
    const store = fakeStore()
    saveGerarPrefs({ legendHidden: ['layer:propriedades', 'layer:focos'] }, store)
    expect(readGerarPrefs(store).legendHidden).toEqual(['layer:propriedades', 'layer:focos'])
  })

  it('tirar tudo de novo (legenda inteira de volta) também é lembrado', () => {
    const store = fakeStore()
    saveGerarPrefs({ legendHidden: ['layer:focos'] }, store)
    saveGerarPrefs({ legendHidden: [] }, store)
    expect(readGerarPrefs(store).legendHidden).toEqual([])
  })

  it('só aceita texto na lista; o resto é descartado', () => {
    const store = fakeStore({ 'prisma:mapa:gerar': JSON.stringify({ v: 1, legendHidden: ['layer:a', 3, null, { x: 1 }] }) })
    expect(readGerarPrefs(store).legendHidden).toEqual(['layer:a'])
  })

  it('com itens tirados, a tela diz que está usando as últimas escolhas; sem nenhum, não', () => {
    expect(isCustomGerar({ legendHidden: ['layer:focos'] })).toBe(true)
    expect(isCustomGerar({ legendHidden: [] })).toBe(false)
  })
})

describe('formato das coordenadas', () => {
  it.each(['dms', 'dd', 'utm'] as const)('lembra %s', (coords) => {
    const store = fakeStore()
    saveGerarPrefs({ coords }, store)
    expect(readGerarPrefs(store).coords).toBe(coords)
  })

  it('graus decimais, como o UTM, contam como escolha diferente do padrão', () => {
    expect(isCustomGerar({ coords: 'dd' })).toBe(true)
    expect(isCustomGerar({ coords: 'dms' })).toBe(false)
  })

  it('o modo do marcador das ações volta; um valor estranho vira "não salvo"', () => {
    const store = fakeStore()
    saveGerarPrefs({ markerLook: 'icon' }, store)
    expect(readGerarPrefs(store).markerLook).toBe('icon')
    expect(readGerarPrefs(fakeStore({ 'prisma:mapa:gerar': JSON.stringify({ v: 1, markerLook: 'bolinha' }) })).markerLook).toBeUndefined()
    expect(isCustomGerar({ markerLook: 'auto' })).toBe(false)
    expect(isCustomGerar({ markerLook: 'dot' })).toBe(true)
  })
})
