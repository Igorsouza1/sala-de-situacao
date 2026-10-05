import { BASEMAP_KEYS, DEFAULT_BASEMAP, HILLSHADE_BASEMAPS, STATIC_STYLES, tintMineral, type MapTokens } from '../helpers/basemaps'

const t: MapTokens = {
  bg: 'BG', water: 'WATER', waterText: 'WATERTEXT', forest: 'FOREST', grass: 'GRASS', urban: 'URBAN',
  building: 'BUILDING', casing: 'CASING', boundary: 'BOUNDARY', text: 'TEXT', shadow: 'S', shadowAccent: 'SA',
}

const estilo = {
  version: 8,
  layers: [
    { id: 'background', type: 'background' },
    { id: 'water', type: 'fill' },
    { id: 'landcover_wood', type: 'fill' },
    { id: 'landuse_pitch', type: 'fill' },
    { id: 'landuse_residential', type: 'fill' },
    { id: 'building', type: 'fill' },
    { id: 'aeroway', type: 'fill' },
    { id: 'waterway', type: 'line' },
    { id: 'boundary_state', type: 'line' },
    { id: 'road_casing', type: 'line' },
    { id: 'road_primary', type: 'line' },
    { id: 'water_name', type: 'symbol' },
    { id: 'place_city', type: 'symbol' },
  ],
}

describe('tintMineral', () => {
  const out = tintMineral(estilo, t)
  const paint = (id: string) => out.layers.find((l: any) => l.id === id).paint

  it('pinta água, mata, campo, urbano e prédios na paleta', () => {
    expect(paint('background')['background-color']).toBe('BG')
    expect(paint('water')['fill-color']).toBe('WATER')
    expect(paint('landcover_wood')['fill-color']).toBe('FOREST')
    expect(paint('landuse_pitch')['fill-color']).toBe('GRASS')
    expect(paint('landuse_residential')['fill-color']).toBe('URBAN')
    expect(paint('building')['fill-color']).toBe('BUILDING')
    expect(paint('aeroway')['fill-color']).toBe('BG')
  })

  it('deixa as ruas brancas, com contorno e limites discretos', () => {
    expect(paint('road_primary')['line-color']).toBe('BG')
    expect(paint('road_casing')['line-color']).toBe('CASING')
    expect(paint('boundary_state')['line-color']).toBe('BOUNDARY')
    expect(paint('waterway')['line-color']).toBe('WATER')
  })

  it('texto da água em azul-ardósia, o resto em cinza-tinta, com halo do fundo', () => {
    expect(paint('water_name')['text-color']).toBe('WATERTEXT')
    expect(paint('place_city')['text-color']).toBe('TEXT')
    expect(paint('place_city')['text-halo-color']).toBe('BG')
  })

  it('não altera o estilo original', () => {
    expect((estilo.layers[1] as any).paint).toBeUndefined()
  })
})

describe('bases', () => {
  it('Mineral é o padrão e todas as outras têm estilo', () => {
    expect(DEFAULT_BASEMAP).toBe('mineral')
    for (const k of BASEMAP_KEYS.filter((k) => k !== 'mineral')) expect(STATIC_STYLES[k as keyof typeof STATIC_STYLES]).toBeTruthy()
  })

  it('relevo sombreado só no Mineral, Ruas e StreetMap', () => {
    expect([...HILLSHADE_BASEMAPS].sort()).toEqual(['mineral', 'osm', 'streets'])
  })
})
