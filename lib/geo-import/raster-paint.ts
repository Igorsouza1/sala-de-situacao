// Pintar a imagem empacotada (raster-pack) para o mapa, só com o que a pessoa pediu: um período de anos.
// Puro (sem navegador). Duas coisas além de colorir:
//  1) o raster vem em latitude/longitude, mas o mapa estica a imagem em Mercator; sem corrigir, o meio da imagem erraria cerca de
//     160 m numa área de 1,4° de altura (5 pixels de 30 m). As linhas são reamostradas em Mercator na hora de pintar.
//  2) vários anos viram "quantas vezes": cada pixel é mais escuro quanto mais vezes queimou dentro do período.

import type { RasterMode } from './raster-pack'

export type Bounds = [number, number, number, number] // oeste, sul, leste, norte

export interface PaintConfig {
  mode: RasterMode
  /** cor da camada, em RGB */
  rgb: [number, number, number]
  /** modo "bandas": índices (de 0) da primeira e da última banda do período */
  from?: number
  to?: number
  /** modo "valores": maior valor do raster (escala da cor) */
  max?: number
}

const RAD = Math.PI / 180
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2))
const latFromMercY = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / RAD

/** Para cada linha da imagem em Mercator, de qual linha do raster (em latitude) ela vem. */
export function mercatorRowMap(height: number, bounds: Bounds): Uint32Array {
  const [, south, , north] = bounds
  const yTop = mercY(north)
  const yBottom = mercY(south)
  const map = new Uint32Array(height)
  for (let j = 0; j < height; j++) {
    const lat = latFromMercY(yTop + ((yBottom - yTop) * (j + 0.5)) / height)
    const row = Math.floor(((north - lat) / (north - south)) * height)
    map[j] = Math.min(height - 1, Math.max(0, row))
  }
  return map
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** De 1 até `steps`: do tom claro da cor ao tom cheio. Um passo só (ou o primeiro) usa a cor cheia. */
export function shade(rgb: [number, number, number], step: number, steps: number): [number, number, number] {
  if (steps <= 1) return rgb
  const t = 0.35 + 0.65 * ((step - 1) / (steps - 1)) // 35% (claro) a 100% (cheio)
  return [Math.round(255 - (255 - rgb[0]) * t), Math.round(255 - (255 - rgb[1]) * t), Math.round(255 - (255 - rgb[2]) * t)]
}

const popcount = (v: number) => {
  v -= (v >>> 1) & 0x55555555
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333)
  return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24
}

/** Quantos anos o período cobre (para a escala de "quantas vezes"). */
export const yearsInRange = (from: number, to: number) => Math.max(1, to - from + 1)

/**
 * Pinta `src` (RGBA empacotado, w × h) em `dest` (RGBA de verdade, w × h, já em Mercator).
 * Pixel sem dado ou sem ocorrência no período fica transparente.
 */
export function paintRaster(src: Uint32Array, dest: Uint32Array, width: number, height: number, bounds: Bounds, cfg: PaintConfig): void {
  const rows = mercatorRowMap(height, bounds)

  // tabela de cores por contagem, montada uma vez (no máximo 24 níveis)
  const steps = cfg.mode === 'bandas' ? yearsInRange(cfg.from ?? 0, cfg.to ?? 0) : Math.max(1, cfg.max ?? 1)
  const table = new Uint32Array(Math.min(steps, 255) + 1)
  for (let s = 1; s < table.length; s++) {
    const [r, g, b] = shade(cfg.rgb, s, Math.min(steps, 255))
    table[s] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
  }

  let rangeMask = 0
  if (cfg.mode === 'bandas') {
    const from = Math.max(0, cfg.from ?? 0)
    const to = Math.min(23, cfg.to ?? 23)
    for (let b = from; b <= to; b++) rangeMask |= 1 << b
  }

  for (let j = 0; j < height; j++) {
    const srcRow = rows[j] * width
    const destRow = j * width
    for (let i = 0; i < width; i++) {
      const v = src[srcRow + i]
      if (v >>> 24 === 0) {
        dest[destRow + i] = 0
        continue
      }
      const n = cfg.mode === 'bandas' ? popcount(v & rangeMask & 0xffffff) : v & 0xff
      dest[destRow + i] = n === 0 ? 0 : table[Math.min(n, table.length - 1)]
    }
  }
}
