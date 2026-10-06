// A barra de escala (DESIGN.md 13.7): um traço que vale uma distância redonda ("200 m", "2 km") no zoom e na latitude de agora.
// O MapLibre desenha o mundo em 512 px no zoom 0 (e não em 256, como o mapa web clássico): 40.075.017 m ÷ 512 no equador.
const METERS_PER_PIXEL_Z0 = 78271.51696

/** quantos metros cabem em um pixel, nesta latitude e neste zoom (projeção do MapLibre) */
export const metersPerPixel = (lat: number, zoom: number) => (METERS_PER_PIXEL_Z0 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom

/** a maior distância redonda (1, 2 ou 5 vezes uma potência de 10) que não passa de `meters` */
export function niceDistance(meters: number): number {
  if (!(meters > 0)) return 0
  const power = 10 ** Math.floor(Math.log10(meters))
  const lead = meters / power
  return (lead >= 5 ? 5 : lead >= 2 ? 2 : 1) * power
}

export const distanceLabel = (meters: number) => (meters >= 1000 ? `${+(meters / 1000).toFixed(1)} km`.replace('.', ',') : `${meters} m`)

/** a barra: quantos pixels de largura e o que ela vale, sem passar de `maxPx` */
export function scaleBar(lat: number, zoom: number, maxPx = 96): { width: number; label: string } {
  const mpp = metersPerPixel(lat, zoom)
  const meters = niceDistance(mpp * maxPx)
  return { width: Math.round(meters / mpp), label: distanceLabel(meters) }
}

// ── A escala no papel (Gerar mapa) ────────────────────────────────────────────────────────────────────────────────
// Na folha, a escala é medida no papel: o quadro do mapa tem `mm` milímetros de largura e aparece na tela com `px` pixels.

/** o quadro do mapa na folha: largura real no papel (mm) e largura na tela (px) */
export interface PaperFrame { mm: number; px: number }

const NO_SCALE = { metersPerMm: 0, ratio: 0, label: '' }

// "1:48.731" → "1:49.000": é uma escala aproximada, e dois algarismos bastam para quem lê
const roundTwoDigits = (n: number) => {
  const step = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1)
  return Math.round(n / step) * step
}
const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** quantos metros do terreno cabem em 1 mm do papel, e a razão aproximada ("1:50.000") */
export function paperScale(lat: number, zoom: number, frame: PaperFrame): { metersPerMm: number; ratio: number; label: string } {
  if (!(frame.mm > 0 && frame.px > 0)) return NO_SCALE
  const metersPerMm = metersPerPixel(lat, zoom) * (frame.px / frame.mm)
  const ratio = metersPerMm * 1000
  return { metersPerMm, ratio, label: `1:${thousands(roundTwoDigits(ratio))}` }
}

const tick = (n: number) => String(+n.toFixed(1)).replace('.', ',')

/** a barra gráfica no papel: a largura em mm (sem passar de `maxMm`), o que vale e os rótulos 0, meio e fim */
export function paperScaleBar(lat: number, zoom: number, frame: PaperFrame, maxMm: number): { widthMm: number; meters: number; ticks: string[] } {
  const { metersPerMm } = paperScale(lat, zoom, frame)
  if (!(metersPerMm > 0)) return { widthMm: 0, meters: 0, ticks: [] }
  const meters = niceDistance(metersPerMm * maxMm)
  const km = meters >= 1000
  const unit = km ? 1000 : 1
  return { widthMm: meters / metersPerMm, meters, ticks: ['0', tick(meters / 2 / unit), `${tick(meters / unit)} ${km ? 'km' : 'm'}`] }
}
