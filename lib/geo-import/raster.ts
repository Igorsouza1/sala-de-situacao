// Ler um GeoTIFF solto no mapa e transformá-lo na imagem empacotada que o servidor guarda (ver raster-pack.ts).
// Roda no navegador: a decodificação é por janelas de linhas, com uma pausa entre elas para a tela (e a barra de andamento) respirar.

import { MAX_YEAR_BANDS, firstYearFromName, packBands, packValues, type RasterMode } from './raster-pack'
import type { Bounds } from './raster-paint'

export const MAX_RASTER_MB = 200
const MAX_PIXELS = 40_000_000
const ROWS_PER_WINDOW = 256
/** o servidor aceita no máximo isto de imagem (o corpo de uma requisição na Vercel passa de pouco mais de 4 MB) */
export const MAX_PACKED_BYTES = 4_000_000

export type RasterProblem =
  | { code: 'ilegivel' }
  | { code: 'sem-georreferencia' }
  | { code: 'projetado'; epsg: number }
  | { code: 'bits' }
  | { code: 'grande'; mb: number }
  | { code: 'bandas'; n: number }
  | { code: 'nao-binario' }
  | { code: 'sem-anos' }
  | { code: 'imagem' }
  | { code: 'pesado' }

export function rasterProblemMessage(p: RasterProblem): string {
  switch (p.code) {
    case 'ilegivel':
      return 'Não conseguimos ler este raster. Confira se é um GeoTIFF e solte de novo.'
    case 'sem-georreferencia':
      return 'Este raster não diz onde fica no mapa (falta a georreferência). Exporte de novo com as coordenadas.'
    case 'projetado':
      return `Este raster está em outro sistema de coordenadas (EPSG:${p.epsg}). Reprojete para latitude e longitude (WGS 84 ou SIRGAS 2000) e solte de novo.`
    case 'bits':
      return 'Por enquanto o mapa lê rasters de 8 bits (valores de 0 a 255). Este tem outro formato.'
    case 'grande':
      return `O raster tem ${p.mb} MB e passa do limite de ${MAX_RASTER_MB} MB. Recorte para a área que importa e solte de novo.`
    case 'bandas':
      return `Este raster tem ${p.n} bandas e o mapa lê até ${MAX_YEAR_BANDS} (uma por ano). Recorte o período e solte de novo.`
    case 'nao-binario':
      return 'As bandas deste raster têm valores além de 0 e 1. O mapa lê rasters de uma banda (valores) ou de uma banda por ano (0 = não, 1 = sim).'
    case 'sem-anos':
      return 'Não achamos o ano de cada banda. Ponha o período no nome do arquivo (ex.: fogo_2004_2025.tif) e solte de novo.'
    case 'imagem':
      return 'Este navegador não conseguiu montar a imagem do raster. Tente num computador.'
    case 'pesado':
      return 'Mesmo compactado, este raster passa do que o mapa guarda. Recorte para uma área menor e solte de novo.'
  }
}

export class RasterProblemError extends Error {
  constructor(readonly problem: RasterProblem) {
    super(rasterProblemMessage(problem))
  }
}

export interface RasterInfo {
  width: number
  height: number
  bands: number
  bounds: Bounds
  nodata: number | null
  /** modo "bandas": o primeiro ano (o ano de cada banda segue a ordem) */
  firstYear: number | null
  mode: RasterMode
}

export interface RasterConversion extends RasterInfo {
  png: Blob
  /** maior valor do raster (modo "valores") */
  max: number
}

const GEOGRAPHIC_OK = new Set([4326, 4674])

/** Lê só o cabeçalho (rápido) e confere se o raster serve. */
export async function inspectRaster(file: File): Promise<RasterInfo> {
  if (file.size > MAX_RASTER_MB * 1024 * 1024) throw new RasterProblemError({ code: 'grande', mb: Math.round(file.size / 1024 / 1024) })
  const { fromBlob } = await import('geotiff')
  let image
  try {
    image = await (await fromBlob(file)).getImage()
  } catch {
    throw new RasterProblemError({ code: 'ilegivel' })
  }

  const keys = image.getGeoKeys() as Record<string, number> | null
  const epsg = keys?.GeographicTypeGeoKey ?? keys?.ProjectedCSTypeGeoKey
  if (!keys || !epsg) throw new RasterProblemError({ code: 'sem-georreferencia' })
  if (!GEOGRAPHIC_OK.has(epsg)) throw new RasterProblemError({ code: 'projetado', epsg })

  const bits = image.getBitsPerSample(0)
  if (bits !== 8) throw new RasterProblemError({ code: 'bits' })

  const width = image.getWidth()
  const height = image.getHeight()
  if (width * height > MAX_PIXELS) throw new RasterProblemError({ code: 'grande', mb: Math.round(file.size / 1024 / 1024) })

  const bands = image.getSamplesPerPixel()
  if (bands > MAX_YEAR_BANDS) throw new RasterProblemError({ code: 'bandas', n: bands })
  const mode: RasterMode = bands === 1 ? 'valores' : 'bandas'
  const firstYear = mode === 'bandas' ? firstYearFromName(file.name, bands) : null
  if (mode === 'bandas' && firstYear === null) throw new RasterProblemError({ code: 'sem-anos' })

  const [w, s, e, n] = image.getBoundingBox()
  return { width, height, bands, bounds: [w, s, e, n], nodata: image.getGDALNoData(), firstYear, mode }
}

const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** Decodifica o raster em janelas de linhas e monta a imagem empacotada (PNG sem perdas). `onProgress` vai de 0 a 1. */
export async function convertRaster(file: File, info: RasterInfo, onProgress: (fraction: number) => void): Promise<RasterConversion> {
  const { fromBlob } = await import('geotiff')
  const image = await (await fromBlob(file)).getImage()
  const { width, height, bands, nodata, mode } = info

  const packed = new Uint32Array(width * height)
  let max = 1
  for (let top = 0; top < height; top += ROWS_PER_WINDOW) {
    const bottom = Math.min(height, top + ROWS_PER_WINDOW)
    const rasters = (await image.readRasters({ window: [0, top, width, bottom] })) as unknown as ArrayLike<number>[]
    const pixels = width * (bottom - top)
    const offset = width * top
    if (mode === 'bandas') {
      const r = packBands(Array.from({ length: bands }, (_, b) => rasters[b]), pixels, nodata, packed, offset)
      if (r.nonBinary) throw new RasterProblemError({ code: 'nao-binario' })
    } else {
      max = Math.max(max, packValues(rasters[0], pixels, nodata, packed, offset).max)
    }
    onProgress(bottom / height)
    await breathe()
  }

  const png = await toPng(packed, width, height)
  if (png.size > MAX_PACKED_BYTES) throw new RasterProblemError({ code: 'pesado' })
  return { ...info, png, max }
}

async function toPng(packed: Uint32Array, width: number, height: number): Promise<Blob> {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('sem canvas')
    ctx.putImageData(new ImageData(new Uint8ClampedArray(packed.buffer, packed.byteOffset, packed.byteLength), width, height), 0, 0)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('sem imagem')
    return blob
  } catch {
    throw new RasterProblemError({ code: 'imagem' })
  }
}
