import { colorFromFile, kindOfFile, nameFromFile } from '../files'

describe('kindOfFile', () => {
  it('separa vetor, raster e o resto, sem diferenciar maiúsculas', () => {
    expect(kindOfFile('a.geojson')).toBe('geojson')
    expect(kindOfFile('A.JSON')).toBe('geojson')
    expect(kindOfFile('fogo.tif')).toBe('raster')
    expect(kindOfFile('fogo.TIFF')).toBe('raster')
    expect(kindOfFile('mapa.pdf')).toBe('desconhecido')
  })
})

describe('nameFromFile', () => {
  it('tira a extensão e os sublinhados', () => {
    expect(nameFromFile('desmatamento_alertas_mapbiomas_buffer10km_2019_2025.geojson')).toBe('Desmatamento alertas mapbiomas buffer10km 2019 2025')
  })
  it('não devolve vazio', () => {
    expect(nameFromFile('.geojson')).toBe('Nova camada')
  })
})

describe('colorFromFile', () => {
  it('escolhe pelo assunto', () => {
    expect(colorFromFile('fogo_mapbiomas.tif')).toBe('#ea580c')
    expect(colorFromFile('desmatamento_alertas.geojson')).toBe('#dc2626')
    expect(colorFromFile('qualquer.geojson')).toBe('#3b82f6')
  })
})
