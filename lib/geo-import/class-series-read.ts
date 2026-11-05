// Ler no navegador uma série de anos de um raster de classes (um GeoTIFF por ano) e transformá-la no que o servidor guarda:
// o primeiro ano inteiro e, dos outros, só o que mudou, tudo comprimido (ver class-series.ts). Antes de gravar, a série é
// conferida: anos repetidos, arquivo que não abre ou em outra projeção param tudo; ano faltando ou em outra grade só avisam.

import {
  SeriesDecoder,
  buildStats,
  classAreas,
  deltaFrame,
  missingYears,
  normalizeClasses,
  pixelSize,
  referenceGrid,
  repeatedYears,
  resampleNearest,
  rowAreasHa,
  sameGrid,
  seriesName,
  yearFromName,
  type Grid,
  type SeriesFrames,
  type SeriesStats,
} from './class-series'
import { isMapBiomasLegend, looksLikeClasses, sortClasses } from './mapbiomas'
import { MAX_SERIES_STORED_BYTES as MAX_SERIES_BYTES, MAX_SERIES_YEARS } from './series-meta'

const MAX_FRAME_PIXELS = 16_000_000
const GEOGRAPHIC_OK = new Set([4326, 4674])

export type SeriesProblem =
  | { code: 'repetido'; years: number[] }
  | { code: 'ilegivel'; file: string }
  | { code: 'sem-georreferencia'; file: string }
  | { code: 'projetado'; file: string; epsg: number }
  | { code: 'formato'; file: string }
  | { code: 'grande' }
  | { code: 'pesado' }
  | { code: 'sem-ano'; file: string }

const list = (ys: number[]) => (ys.length === 1 ? `${ys[0]}` : `${ys.slice(0, -1).join(', ')} e ${ys[ys.length - 1]}`)

export function seriesProblemMessage(p: SeriesProblem): string {
  switch (p.code) {
    case 'repetido':
      return `Há mais de um arquivo para ${list(p.years)}. Deixe um arquivo por ano e solte de novo.`
    case 'ilegivel':
      return `Não conseguimos ler “${p.file}”. Confira se é um GeoTIFF e solte a série de novo.`
    case 'sem-georreferencia':
      return `“${p.file}” não diz onde fica no mapa (falta a georreferência). Exporte de novo com as coordenadas.`
    case 'projetado':
      return `“${p.file}” está em outro sistema de coordenadas (EPSG:${p.epsg}). Reprojete a série para latitude e longitude (WGS 84 ou SIRGAS 2000).`
    case 'formato':
      return `“${p.file}” não é um raster de classes (uma banda, valores de 0 a 255). A série precisa ser de classes, como o uso do solo do MapBiomas.`
    case 'grande':
      return 'Cada ano desta série é grande demais para o mapa. Recorte para a área que importa e solte de novo.'
    case 'pesado':
      return 'Mesmo guardando só o que muda de um ano para o outro, esta série passa do que o mapa guarda. Recorte uma área menor ou use menos anos.'
    case 'sem-ano':
      return `“${p.file}” é de uso do solo, mas o nome não diz de que ano é. Ponha o ano no nome (ex.: uso_solo_2024.tif) e solte de novo.`
  }
}

/**
 * Lê os valores de um raster de uma banda e diz se ele é de CLASSES (uso do solo): aí ele entra como série (de um ano ou mais),
 * com as cores da legenda, e não como raster de valores com uma cor só.
 */
export async function probeClasses(file: File): Promise<boolean> {
  const { fromBlob } = await import('geotiff')
  try {
    const image = await (await fromBlob(file)).getImage()
    if (image.getBitsPerSample(0) !== 8 || image.getSamplesPerPixel() !== 1) return false
    const [band] = (await image.readRasters()) as unknown as ArrayLike<number>[]
    const seen = new Uint8Array(256)
    const values = normalizeClasses(band, image.getGDALNoData())
    for (let i = 0; i < values.length; i++) seen[values[i]] = 1
    const codes: number[] = []
    for (let c = 1; c < 256; c++) if (seen[c]) codes.push(c)
    return looksLikeClasses(codes, file.name)
  } catch {
    return false
  }
}

export class SeriesProblemError extends Error {
  constructor(readonly problem: SeriesProblem) {
    super(seriesProblemMessage(problem))
  }
}

export interface SeriesYear {
  file: File
  year: number
  grid: Grid
  nodata: number | null
}

export interface SeriesInspection {
  name: string
  years: SeriesYear[]
  /** a grade em que a série fica (a da maioria dos arquivos) */
  grid: Grid
  /** anos que vieram noutra grade e serão ajustados a ela */
  adjusted: { year: number; finer: boolean }[]
  missing: number[]
  /** o que os arquivos somam, em bytes */
  sourceBytes: number
}

export interface SeriesConversion extends SeriesInspection {
  /** a série comprimida, como vai para o servidor */
  data: Blob
  stats: SeriesStats
  /** todas as classes são do MapBiomas (nomes e cores oficiais) */
  mapbiomas: boolean
}

/** Lê só o cabeçalho de cada arquivo (rápido) e confere se a série serve. */
export async function inspectSeries(files: File[]): Promise<SeriesInspection> {
  const noYear = files.find((f) => yearFromName(f.name) === null)
  if (noYear) throw new SeriesProblemError({ code: 'sem-ano', file: noYear.name })
  const years = files.map((f) => yearFromName(f.name)!)
  if (years.length > MAX_SERIES_YEARS) throw new SeriesProblemError({ code: 'pesado' })
  const rep = repeatedYears(years)
  if (rep.length) throw new SeriesProblemError({ code: 'repetido', years: rep })

  const { fromBlob } = await import('geotiff')
  const out: SeriesYear[] = []
  for (const file of files) {
    let image
    try {
      image = await (await fromBlob(file)).getImage()
    } catch {
      throw new SeriesProblemError({ code: 'ilegivel', file: file.name })
    }
    const keys = image.getGeoKeys() as Record<string, number> | null
    const epsg = keys?.GeographicTypeGeoKey ?? keys?.ProjectedCSTypeGeoKey
    if (!keys || !epsg) throw new SeriesProblemError({ code: 'sem-georreferencia', file: file.name })
    if (!GEOGRAPHIC_OK.has(epsg)) throw new SeriesProblemError({ code: 'projetado', file: file.name, epsg })
    if (image.getBitsPerSample(0) !== 8 || image.getSamplesPerPixel() !== 1) throw new SeriesProblemError({ code: 'formato', file: file.name })
    const width = image.getWidth()
    const height = image.getHeight()
    if (width * height > MAX_FRAME_PIXELS) throw new SeriesProblemError({ code: 'grande' })
    const [w, s, e, n] = image.getBoundingBox()
    out.push({ file, year: yearFromName(file.name)!, grid: { width, height, bounds: [w, s, e, n] }, nodata: image.getGDALNoData() })
  }

  const grid = referenceGrid(out.map((y) => y.grid))
  return {
    name: seriesName(files[0].name),
    years: out,
    grid,
    adjusted: out.filter((y) => !sameGrid(y.grid, grid)).map((y) => ({ year: y.year, finer: pixelSize(y.grid) < pixelSize(grid) })),
    missing: missingYears(out.map((y) => y.year)),
    sourceBytes: files.reduce((s, f) => s + f.size, 0),
  }
}

const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/**
 * Lê ano a ano, ajusta à grade da série, soma as áreas e grava só o que mudou num fluxo comprimido.
 * Só dois anos ficam na memória por vez. `onProgress` vai de 0 a 1.
 */
export async function convertSeries(insp: SeriesInspection, onProgress: (fraction: number) => void): Promise<SeriesConversion> {
  const { fromBlob } = await import('geotiff')
  const { grid } = insp
  const rows = rowAreasHa(grid)
  const stream = new CompressionStream('deflate')
  const writer = stream.writable.getWriter()
  const compressed = new Response(stream.readable).blob() // lê enquanto escreve (senão o fluxo trava)

  const perYear: Map<number, number>[] = []
  let prev: Uint8Array | null = null
  try {
    for (let k = 0; k < insp.years.length; k++) {
      const y = insp.years[k]
      const image = await (await fromBlob(y.file)).getImage()
      const [band] = (await image.readRasters()) as unknown as ArrayLike<number>[]
      let frame = normalizeClasses(band, y.nodata)
      if (!sameGrid(y.grid, grid)) frame = resampleNearest(frame, y.grid, grid)
      perYear.push(classAreas(frame, grid, rows))
      await writer.write(prev ? deltaFrame(prev, frame) : frame)
      prev = frame
      onProgress((k + 1) / insp.years.length)
      await breathe()
    }
    await writer.close()
  } catch (e) {
    await writer.abort().catch(() => {})
    throw e instanceof SeriesProblemError ? e : new SeriesProblemError({ code: 'ilegivel', file: insp.years[perYear.length]?.file.name ?? '' })
  }

  const data = await compressed
  if (data.size > MAX_SERIES_BYTES) throw new SeriesProblemError({ code: 'pesado' })
  const stats = buildStats(perYear, sortClasses)
  return { ...insp, data, stats, mapbiomas: isMapBiomasLegend(stats.classes) }
}

/** Abre a série comprimida (do servidor ou da prévia) para pintar qualquer ano. */
export async function decodeSeries(source: Blob, pixels: number, count: number): Promise<SeriesFrames> {
  const decoder = new SeriesDecoder(pixels, count)
  const reader = source.stream().pipeThrough(new DecompressionStream('deflate')).getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    decoder.push(value)
  }
  return decoder.finish()
}
