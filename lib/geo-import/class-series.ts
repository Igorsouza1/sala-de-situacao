// Série de anos de um raster de classes (ex.: uso do solo do MapBiomas, um GeoTIFF por ano).
//
// Como guardamos pouco: de um ano para o outro quase nada muda (no teste com 39 anos de Bonito, só 1 em cada 3 pixels muda
// alguma vez). Então o primeiro ano vai inteiro e cada ano seguinte só diz o que mudou: o pixel que ficou igual vira UNCHANGED.
// Comprimido (deflate), 39 arquivos de 10 MB viraram 0,33 MB. Para mostrar um ano, o mapa parte do primeiro e aplica as mudanças.
// Tudo aqui é puro (sem navegador), para valer igual no teste, na tela e no servidor.

export const UNCHANGED = 255
/** valor de "fora da área" (o recorte do MapBiomas usa 0; o "sem dado" declarado também vira 0) */
export const OUTSIDE = 0

export type Bounds = [number, number, number, number] // oeste, sul, leste, norte

export interface Grid {
  width: number
  height: number
  bounds: Bounds
}

// ── Arquivos ────────────────────────────────────────────────────────────────

const YEAR = /(?<!\d)((?:19|20)\d{2})(?!\d)/g

/** O ano que o nome do arquivo diz ("..._BAP_1985.tif" → 1985). Sem ano, ou com dois anos diferentes (um período), devolve null. */
export function yearFromName(fileName: string): number | null {
  const base = fileName.replace(/\.[^.]+$/, '')
  const years = new Set(Array.from(base.matchAll(YEAR), (m) => Number(m[1])))
  return years.size === 1 ? [...years][0] : null
}

/** O nome sem o ano: arquivos com o mesmo "tronco" são anos da mesma série. */
export function stemOf(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(YEAR, '#').toLowerCase()
}

/**
 * Separa o que foi solto: rasters com ano e o mesmo tronco (dois ou mais) viram uma série; o resto segue um a um.
 * A série vem em ordem de ano.
 */
export function groupSeries<T extends { name: string }>(files: T[]): { series: T[][]; singles: T[] } {
  const groups = new Map<string, T[]>()
  const singles: T[] = []
  for (const f of files) {
    const isRaster = /\.tiff?$/i.test(f.name)
    if (!isRaster || yearFromName(f.name) === null) { singles.push(f); continue }
    const key = stemOf(f.name)
    groups.set(key, [...(groups.get(key) ?? []), f])
  }
  const series: T[][] = []
  for (const g of groups.values()) {
    if (g.length < 2) singles.push(...g)
    else series.push(g.sort((a, b) => yearFromName(a.name)! - yearFromName(b.name)!))
  }
  return { series, singles }
}

/** Um nome que a pessoa só confirma: "CN_MapBiomas_UsoSolo_BAP_1985.tif" → "Uso do solo MapBiomas (BAP)". */
export function seriesName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '').replace(YEAR, ' ').replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (/mapbiomas/i.test(stem) && /uso|cobertura|lulc|landuse/i.test(stem)) {
    const rest = stem.replace(/\b(cn|mapbiomas|uso\s*solo|usosolo|uso|solo|cobertura|lulc|landuse|recortad[oa])\b/gi, ' ').replace(/\s+/g, ' ').trim()
    return rest ? `Uso do solo MapBiomas (${rest})` : 'Uso do solo MapBiomas'
  }
  return stem ? stem[0].toUpperCase() + stem.slice(1) : 'Série de anos'
}

/** Anos que faltam entre o primeiro e o último ("faltam 1999 e 2000"). */
export function missingYears(years: number[]): number[] {
  const have = new Set(years)
  const out: number[] = []
  for (let y = Math.min(...years); y <= Math.max(...years); y++) if (!have.has(y)) out.push(y)
  return out
}

/** Anos que aparecem em mais de um arquivo. */
export function repeatedYears(years: number[]): number[] {
  const seen = new Set<number>()
  const rep = new Set<number>()
  for (const y of years) (seen.has(y) ? rep : seen).add(y)
  return [...rep].sort((a, b) => a - b)
}

// ── Grade ───────────────────────────────────────────────────────────────────

export const pixelSize = (g: Grid) => (g.bounds[2] - g.bounds[0]) / g.width

/** Mesma grade: mesmo tamanho e cantos a menos de meio pixel um do outro. */
export function sameGrid(a: Grid, b: Grid): boolean {
  if (a.width !== b.width || a.height !== b.height) return false
  const tol = pixelSize(a) / 2
  return a.bounds.every((v, i) => Math.abs(v - b.bounds[i]) <= tol)
}

/** A grade que a maioria dos arquivos usa (é nela que a série fica; os outros anos se ajustam a ela). */
export function referenceGrid(grids: Grid[]): Grid {
  let best = grids[0]
  let bestCount = 0
  for (const g of grids) {
    const n = grids.filter((o) => sameGrid(g, o)).length
    if (n > bestCount) { best = g; bestCount = n }
  }
  return best
}

/** Leva um ano para outra grade pelo vizinho mais próximo (classe não se mistura: o pixel pega a classe de onde cai o centro). */
export function resampleNearest(src: Uint8Array, from: Grid, to: Grid): Uint8Array {
  const out = new Uint8Array(to.width * to.height)
  const [fw, , fe, fn] = from.bounds
  const fs = from.bounds[1]
  const fx = (fe - fw) / from.width
  const fy = (fn - fs) / from.height
  const [tw, ts, te, tn] = to.bounds
  const tx = (te - tw) / to.width
  const ty = (tn - ts) / to.height
  for (let j = 0; j < to.height; j++) {
    const lat = tn - (j + 0.5) * ty
    const row = Math.floor((fn - lat) / fy)
    if (row < 0 || row >= from.height) continue
    for (let i = 0; i < to.width; i++) {
      const col = Math.floor((tw + (i + 0.5) * tx - fw) / fx)
      if (col >= 0 && col < from.width) out[j * to.width + i] = src[row * from.width + col]
    }
  }
  return out
}

/** Os valores de um ano, prontos para a série: "sem dado", negativos e valores fora de 1 a 254 viram "fora da área" (0). */
export function normalizeClasses(values: ArrayLike<number>, nodata: number | null): Uint8Array {
  const out = new Uint8Array(values.length)
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    out[i] = v === nodata || !(v >= 1 && v <= 254) ? OUTSIDE : v
  }
  return out
}

// ── Codificar e decodificar ─────────────────────────────────────────────────

/** O ano `cur` só com o que mudou desde `prev` (o resto vira UNCHANGED). */
export function deltaFrame(prev: Uint8Array, cur: Uint8Array): Uint8Array {
  const out = new Uint8Array(cur.length)
  for (let i = 0; i < cur.length; i++) out[i] = cur[i] === prev[i] ? UNCHANGED : cur[i]
  return out
}

/**
 * Remonta a série a partir dos bytes já descomprimidos, aos pedaços (como chegam do fluxo). Guarda o primeiro ano inteiro e,
 * dos outros, só as mudanças (posição e classe): cabe na memória mesmo numa série grande.
 */
export class SeriesDecoder {
  private base: Uint8Array
  private changes: { idx: number[]; val: number[] }[] = []
  private pos = 0

  constructor(readonly pixels: number, readonly count: number) {
    this.base = new Uint8Array(pixels)
  }

  push(chunk: Uint8Array): void {
    for (let k = 0; k < chunk.length; k++, this.pos++) {
      const frame = Math.floor(this.pos / this.pixels)
      if (frame >= this.count) throw new Error('série maior que o informado')
      const i = this.pos - frame * this.pixels
      const v = chunk[k]
      if (frame === 0) this.base[i] = v
      else if (v !== UNCHANGED) {
        const c = (this.changes[frame - 1] ??= { idx: [], val: [] })
        c.idx.push(i)
        c.val.push(v)
      }
    }
  }

  finish(): SeriesFrames {
    if (this.pos !== this.pixels * this.count) throw new Error('série incompleta')
    const changes = Array.from({ length: this.count - 1 }, (_, k) => {
      const c = this.changes[k]
      return { idx: Uint32Array.from(c?.idx ?? []), val: Uint8Array.from(c?.val ?? []) }
    })
    return new SeriesFrames(this.base, changes)
  }
}

export class SeriesFrames {
  private current: Uint8Array
  private at = 0

  constructor(private base: Uint8Array, private changes: { idx: Uint32Array; val: Uint8Array }[]) {
    this.current = base.slice()
  }

  get count() { return this.changes.length + 1 }

  /** O ano de índice `k` (0 = o primeiro). Andar para a frente aplica só as mudanças que faltam; voltar recomeça do primeiro. */
  frame(k: number): Uint8Array {
    const target = Math.max(0, Math.min(this.count - 1, k))
    if (target < this.at) { this.current.set(this.base); this.at = 0 }
    for (; this.at < target; this.at++) {
      const { idx, val } = this.changes[this.at]
      for (let n = 0; n < idx.length; n++) this.current[idx[n]] = val[n]
    }
    return this.current
  }
}

// ── Áreas (para o gráfico) ──────────────────────────────────────────────────

const R = 6_371_008.8
const RAD = Math.PI / 180

/** A área de um pixel de cada linha, em hectares (na esfera: o pixel encolhe ao se afastar do equador). */
export function rowAreasHa(g: Grid): Float64Array {
  const [w, s, e, n] = g.bounds
  const dLon = ((e - w) / g.width) * RAD
  const dLat = (n - s) / g.height
  const out = new Float64Array(g.height)
  for (let j = 0; j < g.height; j++) {
    const top = (n - j * dLat) * RAD
    const bottom = (n - (j + 1) * dLat) * RAD
    out[j] = (R * R * dLon * Math.abs(Math.sin(top) - Math.sin(bottom))) / 10_000
  }
  return out
}

/** Hectares de cada classe num ano (o "fora da área" não conta). */
export function classAreas(frame: Uint8Array, g: Grid, rows: Float64Array = rowAreasHa(g)): Map<number, number> {
  const perRow = new Float64Array(256)
  const total = new Float64Array(256)
  for (let j = 0; j < g.height; j++) {
    perRow.fill(0)
    const off = j * g.width
    for (let i = 0; i < g.width; i++) perRow[frame[off + i]]++
    for (let c = 1; c < 256; c++) if (perRow[c]) total[c] += perRow[c] * rows[j]
  }
  const out = new Map<number, number>()
  for (let c = 1; c < 256; c++) if (total[c]) out.set(c, total[c])
  return out
}

/** O que o gráfico precisa, guardado junto da camada: as classes e os hectares de cada uma, ano a ano. */
export interface SeriesStats {
  classes: number[]
  /** ha[ano][classe], na ordem de `years` e `classes`, com uma casa decimal */
  ha: number[][]
}

export function buildStats(perYear: Map<number, number>[], order: (codes: number[]) => number[]): SeriesStats {
  const codes = order([...new Set(perYear.flatMap((m) => [...m.keys()]))])
  return { classes: codes, ha: perYear.map((m) => codes.map((c) => Math.round((m.get(c) ?? 0) * 10) / 10)) }
}

// ── Gráfico ─────────────────────────────────────────────────────────────────

export const OTHERS = -1

/**
 * As classes que o gráfico mostra uma a uma: as `keep` que mais ocupam em algum ano. As outras somam numa só ("Outras").
 * Motivo: mais de 8 cores lado a lado não se distinguem; a classe pequena não some, vai para "Outras".
 */
export function chartClasses(stats: SeriesStats, keep = 8): number[] {
  const peak = stats.classes.map((c, k) => ({ c, max: Math.max(...stats.ha.map((y) => y[k])) }))
  if (peak.length <= keep) return stats.classes
  const top = new Set(peak.sort((a, b) => b.max - a.max).slice(0, keep - 1).map((p) => p.c))
  return [...stats.classes.filter((c) => top.has(c)), OTHERS]
}

/** Os hectares de um ano já agrupados como o gráfico mostra (o "Outras" soma o resto). */
export function yearRow(stats: SeriesStats, yearIndex: number, shown: number[]): Map<number, number> {
  const row = new Map<number, number>(shown.map((c) => [c, 0]))
  stats.classes.forEach((c, k) => {
    const key = row.has(c) ? c : OTHERS
    row.set(key, (row.get(key) ?? 0) + stats.ha[yearIndex][k])
  })
  return row
}

/** Quanto do raster cai dentro da região aberta no mapa (0 a 1), para conferir se é a área certa. */
export function shareInside(raster: Bounds, region: Bounds): number {
  const w = Math.max(raster[0], region[0])
  const s = Math.max(raster[1], region[1])
  const e = Math.min(raster[2], region[2])
  const n = Math.min(raster[3], region[3])
  if (e <= w || n <= s) return 0
  return ((e - w) * (n - s)) / ((raster[2] - raster[0]) * (raster[3] - raster[1]))
}
