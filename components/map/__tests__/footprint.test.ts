import { clusterFootprint, metersPerPixel } from '../helpers/footprint'

describe('metersPerPixel', () => {
  it('é ~156 543 m no zoom 0 do equador e cai pela metade a cada zoom', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(156543.03, 1)
    expect(metersPerPixel(0, 1)).toBeCloseTo(78271.52, 1)
  })
  it('diminui longe do equador', () => {
    expect(metersPerPixel(-21, 14)).toBeLessThan(metersPerPixel(0, 14))
  })
})

describe('clusterFootprint', () => {
  const zoom = 12
  it('sem pontos, não há mancha', () => {
    expect(clusterFootprint([], 18, zoom)).toBeNull()
  })
  it('um ponto vira um círculo', () => {
    expect(clusterFootprint([[-56.5, -21.1]], 18, zoom)?.geometry.type).toBe('Polygon')
  })
  it('pontos próximos se unem numa mancha só', () => {
    const f = clusterFootprint([[-56.5, -21.1], [-56.5005, -21.1]], 18, zoom)
    expect(f?.geometry.type).toBe('Polygon')
  })
  it('pontos distantes ficam em manchas separadas', () => {
    const f = clusterFootprint([[-56.5, -21.1], [-56.2, -21.1]], 18, zoom)
    expect(f?.geometry.type).toBe('MultiPolygon')
  })
  it('pontos repetidos contam como um', () => {
    const f = clusterFootprint([[-56.5, -21.1], [-56.5, -21.1], [-56.5, -21.1]], 18, zoom)
    expect(f?.geometry.type).toBe('Polygon')
  })
})
