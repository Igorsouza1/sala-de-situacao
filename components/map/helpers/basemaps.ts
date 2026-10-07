// Bases do mapa (DESIGN.md 13). O padrão é o Satélite suave; o Mineral é uma opção: o estilo "positron" do OpenFreeMap baixado e recolorido na paleta.
export type BasemapKey = 'mineral' | 'satellite-soft' | 'satellite' | 'streets' | 'osm' | 'topo' | 'natgeo' | 'light' | 'voyager' | 'dark'

export const DEFAULT_BASEMAP: BasemapKey = 'satellite-soft'
export const BASEMAP_KEYS: BasemapKey[] = ['satellite-soft', 'mineral', 'satellite', 'streets', 'osm']
export const BASEMAP_LABELS: Record<BasemapKey, string> = {
  mineral: 'Mineral',
  'satellite-soft': 'Satélite suave',
  satellite: 'Satélite',
  streets: 'Ruas',
  osm: 'StreetMap',
  topo: 'Topográfico',
  natgeo: 'Geográfico',
  light: 'Cinza claro',
  voyager: 'Ruas coloridas',
  dark: 'Escuro',
}

// As cinco primeiras são as do mapa principal (BASEMAP_KEYS); as outras só o Gerar mapa oferece (13.9), para a folha ter o estilo que combina com o assunto.

// Miniaturas feitas só de tokens: lembram a base sem baixar imagem nenhuma.
export const BASEMAP_SWATCH: Record<BasemapKey, string> = {
  mineral: 'linear-gradient(135deg, var(--color-map-grass) 0 55%, var(--color-map-water) 55%)',
  'satellite-soft': 'linear-gradient(135deg, color-mix(in oklab, var(--color-muted-foreground) 45%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-muted-foreground) 55%, var(--color-water)) 55%)',
  satellite: 'linear-gradient(135deg, color-mix(in oklab, var(--color-foreground) 60%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-foreground) 55%, var(--color-water)) 55%)',
  streets: 'linear-gradient(135deg, var(--color-background) 0 55%, var(--color-border) 55%)',
  osm: 'linear-gradient(135deg, var(--color-map-urban) 0 55%, var(--color-map-grass) 55%)',
  topo: 'linear-gradient(135deg, color-mix(in oklab, var(--color-map-grass) 70%, var(--color-warn)) 0 55%, var(--color-map-water) 55%)',
  natgeo: 'linear-gradient(135deg, color-mix(in oklab, var(--color-ok) 35%, var(--color-warn)) 0 55%, color-mix(in oklab, var(--color-water) 55%, var(--color-card)) 55%)',
  light: 'linear-gradient(135deg, var(--color-muted) 0 55%, var(--color-border) 55%)',
  voyager: 'linear-gradient(135deg, color-mix(in oklab, var(--color-warn) 18%, var(--color-card)) 0 55%, color-mix(in oklab, var(--color-water) 40%, var(--color-card)) 55%)',
  dark: 'linear-gradient(135deg, var(--color-foreground) 0 55%, color-mix(in oklab, var(--color-foreground) 70%, var(--color-water)) 55%)',
}

// Relevo sombreado médio só onde ajuda: no satélite a foto já tem as próprias sombras.
export const HILLSHADE_BASEMAPS: ReadonlySet<BasemapKey> = new Set(['mineral', 'streets', 'osm'])
const HILLSHADE_EXAGGERATION = 0.7

// Acima disso a imagem ampliada do satélite fica ruim demais.
export const BASEMAP_MAX_ZOOM: Partial<Record<BasemapKey, number>> = { satellite: 19, 'satellite-soft': 19, topo: 17, natgeo: 16, light: 16 }

// Elevação gratuita da AWS: serve ao relevo sombreado e ao terreno 3D.
// Zoom máximo do DEM: acima de 12 o terreno e o sombreado só ganham malha e tiles a mais, sem relevo visível a mais (planalto e planície).
export const DEM_MAX_ZOOM = 12
export const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']

const raster = (id: string, tiles: string, attribution: string, maxzoom: number, paint?: object) => ({
  version: 8,
  sources: { [id]: { type: 'raster', tiles: [tiles], tileSize: 256, attribution, maxzoom } },
  layers: [{ id: `${id}-layer`, type: 'raster', source: id, ...(paint ? { paint } : {}) }],
})

const ESRI_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const ESRI_ATTRIBUTION = 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'

const esri = (service: string) => `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`

export const STATIC_STYLES: Record<Exclude<BasemapKey, 'mineral'>, string | object> = {
  // maxzoom 17: último nível com dados na região (13). Acima, a Esri devolve o tile "Map data not yet available".
  satellite: raster('esri-satellite', ESRI_TILES, ESRI_ATTRIBUTION, 17),
  // mesma imagem com menos cor e um pouco menos de brilho: o fogo e o desmatamento aparecem mais e o dock branco se destaca
  'satellite-soft': raster('esri-satellite-soft', ESRI_TILES, ESRI_ATTRIBUTION, 17, {
    'raster-saturation': -0.5,
    'raster-brightness-max': 0.88,
    'raster-contrast': -0.15,
  }),
  streets: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  // Acima do último nível com dados a Esri devolve o tile "Map data not yet available": por isso o maxzoom de cada um.
  topo: raster('esri-topo', esri('World_Topo_Map'), 'Tiles © Esri — Esri, DeLorme, NAVTEQ, TomTom, Intermap, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, METI, OpenStreetMap contributors', 17),
  natgeo: raster('esri-natgeo', esri('NatGeo_World_Map'), 'Tiles © Esri — National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC', 16),
  light: raster('esri-light', esri('Canvas/World_Light_Gray_Base'), 'Tiles © Esri — Esri, DeLorme, NAVTEQ', 16),
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
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

// Bases escuras (a foto de satélite) e claras: o que se desenha por cima de várias cores (a mancha dos grupos de ações, 13.4)
// precisa do contraste certo em cada uma. Branco aparece no satélite e some no Mineral; verde aparece no Mineral e some no satélite.
export const DARK_BASEMAPS: ReadonlySet<BasemapKey> = new Set(['satellite', 'satellite-soft'])

export interface OverlayInk {
  /** tokens de cor (do globals.css): preenchimento e contorno, e o fio por fora que os separa do fundo */
  fill: string
  line: string
  casing: string
  fillOpacity: number
  casingOpacity: number
}

export function overlayInk(basemap: BasemapKey): OverlayInk {
  return DARK_BASEMAPS.has(basemap)
    ? { fill: '--color-card', line: '--color-card', casing: '--color-foreground', fillOpacity: 0.3, casingOpacity: 0.35 }
    : { fill: '--color-primary', line: '--color-primary', casing: '--color-card', fillOpacity: 0.22, casingOpacity: 0.9 }
}
