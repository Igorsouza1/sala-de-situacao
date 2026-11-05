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

describe('isSidecarFile', () => {
  const { isSidecarFile } = require('../files') as typeof import('../files')
  it('ignora os auxiliares que vêm junto da pasta, e só eles', () => {
    expect(isSidecarFile('CN_MapBiomas_UsoSolo_BAP_1985.tif.aux.xml')).toBe(true)
    expect(isSidecarFile('Thumbs.db')).toBe(true)
    expect(isSidecarFile('uso.ovr')).toBe(true)
    expect(isSidecarFile('CN_MapBiomas_UsoSolo_BAP_1985.tif')).toBe(false)
    expect(isSidecarFile('limite.geojson')).toBe(false)
  })
})
