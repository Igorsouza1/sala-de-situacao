// Empacotar as bandas de um raster numa imagem RGBA sem perdas (e desfazer na hora de desenhar).
//
// Um raster "por ano" tem uma banda por ano, cada uma com 0 ou 1 (queimou ou não). Em vez de guardar 22 bandas, o mapa guarda UMA
// imagem em que cada ano é um bit: o ano 1 é o bit 0 do vermelho, e assim por diante até 24 anos (vermelho, verde e azul).
// Um raster de uma banda só (ex.: "quantas vezes queimou") guarda o valor no vermelho. O alfa 0 marca "sem dado" (nodata).
// Tudo aqui é puro (sem navegador), para valer igual no teste e na tela.

export const MAX_YEAR_BANDS = 24

export type RasterMode = 'bandas' | 'valores'

export interface PackResult {
  /** achou um valor que não é 0, 1 nem "sem dado" numa banda anual: o raster não é do tipo "um bit por ano" */
  nonBinary: boolean
  /** maior valor visto (modo "valores"), sem contar o "sem dado" */
  max: number
}

/**
 * Empacota `rows` linhas de um raster de várias bandas (uma por ano) em `out`, a partir de `offset` (em pixels).
 * `bands[b]` traz os pixels da banda b, linha por linha.
 */
export function packBands(bands: ArrayLike<number>[], pixels: number, nodata: number | null, out: Uint32Array, offset: number): PackResult {
  let nonBinary = false
  for (let i = 0; i < pixels; i++) {
    let mask = 0
    let allNodata = true
    for (let b = 0; b < bands.length; b++) {
      const v = bands[b][i]
      if (v !== nodata) allNodata = false
      if (v === 1) mask |= 1 << b
      else if (v !== 0 && v !== nodata) nonBinary = true
    }
    // little-endian: byte 0 = R, 1 = G, 2 = B, 3 = A
    out[offset + i] = allNodata ? 0 : ((255 << 24) | mask) >>> 0
  }
  return { nonBinary, max: 1 }
}

/** Empacota uma banda só: o valor vai no vermelho. */
export function packValues(band: ArrayLike<number>, pixels: number, nodata: number | null, out: Uint32Array, offset: number): PackResult {
  let max = 0
  for (let i = 0; i < pixels; i++) {
    const v = band[i]
    if (v === nodata) {
      out[offset + i] = 0
      continue
    }
    const c = v < 0 ? 0 : v > 254 ? 254 : v
    if (c > max) max = c
    out[offset + i] = ((255 << 24) | c) >>> 0
  }
  return { nonBinary: false, max }
}

/** O ano de cada banda, a partir do período que o nome do arquivo diz ("..._2004_2025.tif" com 22 bandas → 2004). */
export function firstYearFromName(fileName: string, bands: number): number | null {
  const m = fileName.match(/(?<!\d)((?:19|20)\d{2})[_\-– ]+((?:19|20)\d{2})(?!\d)/)
  if (!m) return null
  const first = Number(m[1])
  const last = Number(m[2])
  return last - first + 1 === bands ? first : null
}
