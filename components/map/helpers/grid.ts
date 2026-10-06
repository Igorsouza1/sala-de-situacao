// A grade e as coordenadas da folha (Gerar mapa): linhas de latitude e longitude em graus, minutos e segundos, ou em UTM no
// SIRGAS 2000, com o intervalo escolhido pelo zoom. Tudo em coordenadas geográficas [lng, lat]: quem desenha projeta na tela.
// SIRGAS 2000 e GRS80 diferem do WGS84 em frações de milímetro no elipsoide: a mesma fórmula serve aos dois.

export type GridFormat = 'dms' | 'utm'
export interface Bounds { west: number; south: number; east: number; north: number }
export interface GridLine {
  /** meridiano: linha que sobe e desce (longitude, ou "leste" em UTM); paralelo: linha deitada */
  axis: 'meridian' | 'parallel'
  label: string
  /** pontos [lng, lat]: dois bastam em graus (a linha é reta); em UTM ela se curva um pouco e leva mais */
  points: [number, number][]
}
export interface Grid { format: GridFormat; lines: GridLine[]; zone?: number; south?: boolean }

// ── UTM (Snyder, séries de Krüger de ordem baixa: erro de milímetros dentro do fuso, centímetros a 5° do meridiano) ──
const A = 6378137
const F = 1 / 298.257222101 // GRS80
const E2 = F * (2 - F)
const EP2 = E2 / (1 - E2)
const K0 = 0.9996
const FALSE_E = 500000
const FALSE_N_SOUTH = 10000000
const rad = (d: number) => (d * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

export const utmZone = (lng: number) => Math.floor((lng + 180) / 6) + 1
const centralMeridian = (zone: number) => zone * 6 - 183

// comprimento do arco do meridiano do equador até a latitude (rad)
const meridianArc = (phi: number) =>
  A *
  ((1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256) * phi -
    ((3 * E2) / 8 + (3 * E2 ** 2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi) +
    ((15 * E2 ** 2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
    ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi))

export interface Utm { zone: number; south: boolean; easting: number; northing: number }

/** latitude e longitude → UTM. Sem `zone`, usa o fuso do próprio ponto (passar o fuso permite estender a grade para o fuso vizinho). */
export function toUtm(lat: number, lng: number, zone = utmZone(lng)): Utm {
  const phi = rad(lat)
  const sin = Math.sin(phi)
  const cos = Math.cos(phi)
  const tan = Math.tan(phi)
  const N = A / Math.sqrt(1 - E2 * sin * sin)
  const T = tan * tan
  const C = EP2 * cos * cos
  const a = (rad(lng) - rad(centralMeridian(zone))) * cos
  const easting =
    FALSE_E +
    K0 * N * (a + ((1 - T + C) * a ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * a ** 5) / 120)
  const south = lat < 0
  const northing =
    (south ? FALSE_N_SOUTH : 0) +
    K0 *
      (meridianArc(phi) +
        N * tan * ((a * a) / 2 + ((5 - T + 9 * C + 4 * C * C) * a ** 4) / 24 + ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * a ** 6) / 720))
  return { zone, south, easting, northing }
}

/** UTM → latitude e longitude */
export function fromUtm(easting: number, northing: number, zone: number, south: boolean): { lat: number; lng: number } {
  const M = (northing - (south ? FALSE_N_SOUTH : 0)) / K0
  const mu = M / (A * (1 - E2 / 4 - (3 * E2 ** 2) / 64 - (5 * E2 ** 3) / 256))
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2))
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu)
  const sin = Math.sin(phi1)
  const cos = Math.cos(phi1)
  const tan = Math.tan(phi1)
  const C1 = EP2 * cos * cos
  const T1 = tan * tan
  const N1 = A / Math.sqrt(1 - E2 * sin * sin)
  const R1 = (A * (1 - E2)) / (1 - E2 * sin * sin) ** 1.5
  const D = (easting - FALSE_E) / (N1 * K0)
  const phi =
    phi1 -
    ((N1 * tan) / R1) *
      (D ** 2 / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4) / 24 + ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6) / 720)
  const lambda =
    rad(centralMeridian(zone)) +
    (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5) / 120) / cos
  return { lat: deg(phi), lng: deg(lambda) }
}

// ── Graus, minutos e segundos ──────────────────────────────────────────────────────────────────────────────────────
type Precision = 'd' | 'dm' | 'dms'
const pad = (n: number) => String(n).padStart(2, '0')

/** 21°19'40"S, na precisão pedida; o arredondamento leva a casa de cima junto (nunca 60 segundos nem 60 minutos) */
export function formatDms(value: number, axis: 'lat' | 'lng', precision: Precision): string {
  const hemisphere = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W'
  const abs = Math.abs(value)
  if (precision === 'd') return `${Math.round(abs)}°${hemisphere}`
  if (precision === 'dm') {
    const minutes = Math.round(abs * 60)
    return `${Math.floor(minutes / 60)}°${pad(minutes % 60)}'${hemisphere}`
  }
  const seconds = Math.round(abs * 3600)
  return `${Math.floor(seconds / 3600)}°${pad(Math.floor((seconds % 3600) / 60))}'${pad(seconds % 60)}"${hemisphere}`
}

// ── A grade ────────────────────────────────────────────────────────────────────────────────────────────────────────
const DMS_STEPS = [36000, 18000, 7200, 3600, 1800, 1200, 600, 300, 120, 60, 30, 20, 10, 5, 2, 1] // segundos de arco: 10°, 5°, 2°, 1°, 30′ … 1″
const UTM_STEPS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1] // metros
const MIN_LINES = 4 // o maior intervalo que ainda deixa ao menos isso no lado menor do mapa
const EPS = 1e-9
const UTM_SAMPLES = 8
const thin = ' '

/** o maior intervalo da lista que ainda cabe `MIN_LINES` vezes na menor dimensão */
const pickStep = (steps: number[], span: number) => steps.find((s) => span / s >= MIN_LINES) ?? steps[steps.length - 1]

const precisionFor = (stepSeconds: number): Precision => (stepSeconds >= 3600 ? 'd' : stepSeconds >= 60 ? 'dm' : 'dms')

const multiples = (from: number, to: number, step: number) => {
  const out: number[] = []
  for (let k = Math.ceil(from / step - EPS); k * step <= to + EPS; k++) out.push(k * step)
  return out
}

const groupThousands = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, thin)

export function buildGrid(bounds: Bounds, format: GridFormat): Grid {
  const { west, south, east, north } = bounds
  if (!(east > west && north > south)) return { format, lines: [] }

  if (format === 'dms') {
    const step = pickStep(DMS_STEPS, Math.min(east - west, north - south) * 3600)
    const precision = precisionFor(step)
    const lines: GridLine[] = [
      ...multiples(west * 3600, east * 3600, step).map<GridLine>((s) => ({
        axis: 'meridian',
        label: formatDms(s / 3600, 'lng', precision),
        points: [[s / 3600, south], [s / 3600, north]],
      })),
      ...multiples(south * 3600, north * 3600, step).map<GridLine>((s) => ({
        axis: 'parallel',
        label: formatDms(s / 3600, 'lat', precision),
        points: [[west, s / 3600], [east, s / 3600]],
      })),
    ]
    return { format, lines }
  }

  // UTM: o fuso é o do centro do mapa; as linhas de leste e de norte são retas no fuso e levemente inclinadas no mapa
  const centerLng = (west + east) / 2
  const centerLat = (south + north) / 2
  const zone = utmZone(centerLng)
  const isSouth = centerLat < 0
  const corners = [
    toUtm(south, west, zone), toUtm(south, east, zone), toUtm(north, west, zone), toUtm(north, east, zone),
    toUtm(south, centerLng, zone), toUtm(north, centerLng, zone), toUtm(centerLat, west, zone), toUtm(centerLat, east, zone),
  ]
  const eastings = corners.map((c) => c.easting)
  const northings = corners.map((c) => c.northing)
  const [minE, maxE, minN, maxN] = [Math.min(...eastings), Math.max(...eastings), Math.min(...northings), Math.max(...northings)]
  const step = pickStep(UTM_STEPS, Math.min(maxE - minE, maxN - minN))
  const along = (a: number, b: number) => Array.from({ length: UTM_SAMPLES }, (_, i) => a + ((b - a) * i) / (UTM_SAMPLES - 1))
  const point = (e: number, n: number): [number, number] => {
    const p = fromUtm(e, n, zone, isSouth)
    return [p.lng, p.lat]
  }
  const lines: GridLine[] = [
    ...multiples(minE, maxE, step).map<GridLine>((e) => ({ axis: 'meridian', label: groupThousands(e), points: along(minN, maxN).map((n) => point(e, n)) })),
    ...multiples(minN, maxN, step).map<GridLine>((n) => ({ axis: 'parallel', label: groupThousands(n), points: along(minE, maxE).map((e) => point(e, n)) })),
  ]
  return { format, lines, zone, south: isSouth }
}

/** a frase do rodapé: em que sistema estão as coordenadas da grade */
export function datumLine(format: GridFormat, lng: number, lat = -1): string {
  if (format === 'dms') return 'Datum SIRGAS 2000 · coordenadas geográficas'
  return `Datum SIRGAS 2000 · UTM fuso ${utmZone(lng)} ${lat < 0 ? 'Sul' : 'Norte'} · metros`
}

/** onde uma linha (em pontos de tela) cruza uma borda: devolve a outra coordenada no cruzamento, ou null se ela não chega lá */
export function edgeCrossing(points: { x: number; y: number }[], axis: 'x' | 'y', value: number): number | null {
  const other = axis === 'y' ? 'x' : 'y'
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    if ((a[axis] - value) * (b[axis] - value) > 0 || a[axis] === b[axis]) continue
    const t = (value - a[axis]) / (b[axis] - a[axis])
    return a[other] + t * (b[other] - a[other])
  }
  return null
}
