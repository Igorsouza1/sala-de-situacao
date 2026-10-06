import { formatArea, formatCoordinate, formatDistance, isMeasureTool } from '../helpers/tools'

describe('formatDistance', () => {
  it('abaixo de 1 km fica em metros inteiros; a partir daí, em km com vírgula', () => {
    expect(formatDistance(0)).toBe('0 m')
    expect(formatDistance(842.6)).toBe('843 m')
    expect(formatDistance(1234)).toBe('1,23 km')
  })
})

describe('formatArea', () => {
  it('converte metros quadrados em hectares', () => {
    expect(formatArea(25000)).toBe('2,50 ha')
    expect(formatArea(0)).toBe('0,00 ha')
  })
})

describe('formatCoordinate', () => {
  it('usa seis casas, lat primeiro (a ordem de quem cola no Google Maps)', () => {
    expect(formatCoordinate(-21.327773, -56.694734)).toBe('-21.327773, -56.694734')
  })
})

describe('isMeasureTool', () => {
  it('só as duas de medir desenham no mapa', () => {
    expect(isMeasureTool('measure-distance')).toBe(true)
    expect(isMeasureTool('measure-area')).toBe(true)
    expect(isMeasureTool('coords')).toBe(false)
    expect(isMeasureTool(null)).toBe(false)
  })
})
