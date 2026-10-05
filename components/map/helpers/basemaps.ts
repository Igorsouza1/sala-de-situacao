// Bases do mapa (DESIGN.md 13). O Mineral é o padrão: o estilo "positron" do OpenFreeMap baixado e recolorido na paleta.
export type BasemapKey = 'mineral' | 'satellite' | 'streets' | 'osm'

export const DEFAULT_BASEMAP: BasemapKey = 'mineral'
export const BASEMAP_KEYS: BasemapKey[] = ['mineral', 'satellite', 'streets', 'osm']
export const BASEMAP_LABELS: Record<BasemapKey, string> = {
  mineral: 'Mineral',
  satellite: 'Satélite',
  streets: 'Ruas',
  osm: 'StreetMap',
}

// Relevo sombreado médio só onde ajuda: no satélite a foto já tem as próprias sombras.
export const HILLSHADE_BASEMAPS: ReadonlySet<BasemapKey> = new Set(['mineral', 'streets', 'osm'])
const HILLSHADE_EXAGGERATION = 0.7

// Acima disso a imagem ampliada do satélite fica ruim demais.
export const BASEMAP_MAX_ZOOM: Partial<Record<BasemapKey, number>> = { satellite: 19 }

// Elevação gratuita da AWS: serve ao relevo sombreado e ao terreno 3D.
export const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']

const raster = (id: string, tiles: string, attribution: string, maxzoom: number) => ({
  version: 8,
  sources: { [id]: { type: 'raster', tiles: [tiles], tileSize: 256, attribution, maxzoom } },
  layers: [{ id: `${id}-layer`, type: 'raster', source: id }],
})

export const STATIC_STYLES: Record<Exclude<BasemapKey, 'mineral'>, string | object> = {
  // maxzoom 17: último nível com dados na região (13). Acima, a Esri devolve o tile "Map data not yet available".
  satellite: raster(
    'esri-satellite',
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    17,
  ),
  streets: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  osm: raster(
    'osm',
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    19,
  ),
}

const MINERAL_SOURCE_URL = 'https://tiles.openfreemap.org/styles/positron'

// O MapLibre não lê var(): as cores vêm dos tokens do globals.css, na hora de montar o estilo.
export type MapTokens = Record<
  'bg' | 'water' | 'waterText' | 'forest' | 'grass' | 'urban' | 'building' | 'casing' | 'boundary' | 'text' | 'shadow' | 'shadowAccent',
  string
>

export function readMapTokens(): MapTokens {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    bg: v('--color-background'),
    water: v('--color-map-water'),
    waterText: v('--color-map-water-text'),
    forest: v('--color-map-forest'),
    grass: v('--color-map-grass'),
    urban: v('--color-map-urban'),
    building: v('--color-border'),
    casing: v('--color-map-casing'),
    boundary: v('--color-stone'),
    text: v('--color-muted-foreground'),
    shadow: v('--color-map-shadow'),
    shadowAccent: v('--color-map-shadow-accent'),
  }
}

export const hillshadePaint = (t: MapTokens) => ({
  'hillshade-exaggeration': HILLSHADE_EXAGGERATION,
  'hillshade-shadow-color': t.shadow,
  'hillshade-highlight-color': t.bg,
  'hillshade-accent-color': t.shadowAccent,
})

// Fundo liso enquanto o estilo Mineral baixa: o mapa não pisca com outra base antes.
export const blankStyle = (bg: string) => ({
  version: 8 as const,
  sources: {},
  layers: [{ id: 'fundo', type: 'background', paint: { 'background-color': bg } }],
})

let mineralPromise: Promise<any> | null = null

export function loadMineralStyle(): Promise<any> {
  mineralPromise ??= fetch(MINERAL_SOURCE_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`mineral: ${r.status}`)
      return r.json()
    })
    .catch((e) => {
      mineralPromise = null // falha não fica guardada: escolher o Mineral de novo tenta outra vez
      throw e
    })
  return mineralPromise
}

// Vegetação em verde suave, água em azul-ardósia claro, ruas brancas.
// ponytail: regex por id de camada, frágil se o OpenFreeMap renomear camadas; trocar por estilo próprio se quebrar.
export function tintMineral(style: any, t: MapTokens) {
  const s = structuredClone(style)
  for (const l of s.layers) {
    const p = (l.paint ??= {})
    const id: string = l.id
    if (l.type === 'background') p['background-color'] = t.bg
    else if (l.type === 'fill') {
      if (/water/.test(id)) p['fill-color'] = t.water
      else if (/wood|forest/.test(id)) p['fill-color'] = t.forest
      else if (/park|grass|landcover|landuse_(?!resid)/.test(id)) p['fill-color'] = t.grass
      else if (/residential|commercial|industrial|retail/.test(id)) p['fill-color'] = t.urban
      else if (/building/.test(id)) p['fill-color'] = t.building
      else p['fill-color'] = t.bg
    } else if (l.type === 'line') {
      if (/water/.test(id)) p['line-color'] = t.water
      else if (/boundary|admin/.test(id)) p['line-color'] = t.boundary
      else if (/casing/.test(id)) p['line-color'] = t.casing
      else p['line-color'] = t.bg
    } else if (l.type === 'symbol') {
      p['text-color'] = /water/.test(id) ? t.waterText : t.text
      p['text-halo-color'] = t.bg
    }
  }
  return s
}
