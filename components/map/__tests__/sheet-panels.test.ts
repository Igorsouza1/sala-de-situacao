import { DETAIL_ZOOM_STEP, coverageRect, seedCamera, spanLng } from '../helpers/sheet-panels'

describe('de onde cada painel parte', () => {
  const main = { lng: -56.7, lat: -21.2, zoom: 9 }

  it('lado a lado: o outro painel parte da mesma vista do principal', () => {
    expect(seedCamera('side', 0, 1, main, 800)).toEqual(main)
  })

  it('detalhes: dois níveis mais perto, na mesma latitude', () => {
    const d = seedCamera('details', 1, 3, main, 800)
    expect(d.zoom).toBe(main.zoom + DETAIL_ZOOM_STEP)
    expect(d.lat).toBe(main.lat)
  })

  it('detalhes: o do meio fica no centro e os outros se espalham, simétricos', () => {
    const [a, b, c] = [0, 1, 2].map((i) => seedCamera('details', i, 3, main, 800))
    expect(b.lng).toBeCloseTo(main.lng)
    expect(a.lng).toBeLessThan(b.lng)
    expect(main.lng - a.lng).toBeCloseTo(c.lng - main.lng)
  })

  it('com quatro detalhes, todos nascem dentro do mapa grande', () => {
    const half = spanLng(main.zoom, 800) / 2
    for (let i = 0; i < 4; i++) {
      const d = seedCamera('details', i, 4, main, 800)
      const detailHalf = spanLng(d.zoom, 800) / 2
      expect(Math.abs(d.lng - main.lng) + detailHalf).toBeLessThanOrEqual(half)
    }
  })
})

describe('retângulo do detalhe sobre o mapa grande', () => {
  it('projeta os cantos e devolve um retângulo com largura e altura positivas', () => {
    const project = (lng: number, lat: number) => ({ x: (lng + 57) * 100, y: (-21 - lat) * 100 })
    const r = coverageRect({ west: -56.8, south: -21.3, east: -56.6, north: -21.1 }, project)
    expect(r.w).toBeCloseTo(20)
    expect(r.h).toBeCloseTo(20)
    expect(r.x).toBeCloseTo(20)
  })
})
