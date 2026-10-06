import { clearBasemap, clearRegionPrefs, isInsideBounds, readBasemap, readRegionPrefs, saveBasemap, saveRegionPrefs } from '../helpers/map-prefs'

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

describe('preferências por região', () => {
  it('lê de volta o que gravou, junto com o que já estava salvo', () => {
    const store = fakeStore()
    saveRegionPrefs(1, { layers: ['propriedades', 'raw_firms'] }, store)
    saveRegionPrefs(1, { camera: { lng: -56.7, lat: -21.3, zoom: 12 } }, store)
    saveRegionPrefs(1, { area: { minArea: 100 } }, store)
    expect(readRegionPrefs(1, store)).toEqual({
      layers: ['propriedades', 'raw_firms'],
      camera: { lng: -56.7, lat: -21.3, zoom: 12 },
      area: { minArea: 100 },
    })
  })

  it('cada região guarda a sua', () => {
    const store = fakeStore()
    saveRegionPrefs(1, { layers: ['a'] }, store)
    saveRegionPrefs(2, { layers: ['b'] }, store)
    expect(readRegionPrefs(1, store).layers).toEqual(['a'])
    expect(readRegionPrefs(2, store).layers).toEqual(['b'])
    expect(readRegionPrefs(undefined, store)).toEqual({})
  })

  it('lembra uma lista de camadas vazia e um período "sem filtro" (são escolhas, não ausência)', () => {
    const store = fakeStore()
    saveRegionPrefs(1, { layers: [], date: { kind: 'none' }, fauna: { heatmap: false, locations: false } }, store)
    expect(readRegionPrefs(1, store)).toEqual({ layers: [], date: { kind: 'none' }, fauna: { heatmap: false, locations: false } })
  })

  it('"voltar ao padrão" apaga tudo da região', () => {
    const store = fakeStore()
    saveRegionPrefs(1, { layers: ['a'] }, store)
    clearRegionPrefs(1, store)
    expect(readRegionPrefs(1, store)).toEqual({})
  })

  it('descarta o que está estranho, campo a campo, sem quebrar', () => {
    const store = fakeStore({
      'prisma:mapa:regiao:1': JSON.stringify({
        v: 1,
        layers: ['ok'],
        fauna: { heatmap: 'sim', locations: true }, // tipo errado
        date: { kind: 'preset', id: 'ontem' }, // atalho que não existe
        area: { minArea: -5, maxArea: 40 }, // negativo não vale
        camera: { lng: 999, lat: 0, zoom: 10 }, // fora do globo
      }),
    })
    expect(readRegionPrefs(1, store)).toEqual({ layers: ['ok'], area: { maxArea: 40 } })
  })

  it('JSON quebrado, versão antiga e armazenamento bloqueado viram "nada salvo"', () => {
    expect(readRegionPrefs(1, fakeStore({ 'prisma:mapa:regiao:1': '{não é json' }))).toEqual({})
    expect(readRegionPrefs(1, fakeStore({ 'prisma:mapa:regiao:1': JSON.stringify({ v: 0, layers: ['a'] }) }))).toEqual({})
    expect(readRegionPrefs(1, blocked())).toEqual({})
    expect(readRegionPrefs(1, null)).toEqual({})
    expect(() => saveRegionPrefs(1, { layers: ['a'] }, blocked())).not.toThrow()
    expect(() => clearRegionPrefs(1, blocked())).not.toThrow()
  })
})

describe('base do mapa', () => {
  it('grava, lê e esquece; valor desconhecido não vale', () => {
    const store = fakeStore()
    expect(readBasemap(store)).toBeNull()
    saveBasemap('satellite', store)
    expect(readBasemap(store)).toBe('satellite')
    store.setItem('prisma:mapa:base', 'dark-matter') // base que saiu do produto
    expect(readBasemap(store)).toBeNull()
    clearBasemap(store)
    expect(readBasemap(store)).toBeNull()
    expect(readBasemap(blocked())).toBeNull()
  })
})

describe('isInsideBounds', () => {
  const bbox: [number, number, number, number] = [-57, -22, -56, -21]
  it('só aceita a câmera que cai dentro da região', () => {
    expect(isInsideBounds({ lng: -56.5, lat: -21.5, zoom: 12 }, bbox)).toBe(true)
    expect(isInsideBounds({ lng: -50, lat: -21.5, zoom: 12 }, bbox)).toBe(false)
    expect(isInsideBounds({ lng: -56.5, lat: -10, zoom: 12 }, bbox)).toBe(false)
  })
})
