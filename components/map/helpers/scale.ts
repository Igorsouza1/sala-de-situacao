// A barra de escala (DESIGN.md 13.7): um traço que vale uma distância redonda ("200 m", "2 km") no zoom e na latitude de agora.
const METERS_PER_PIXEL_Z0 = 156543.03392

/** quantos metros cabem em um pixel, nesta latitude e neste zoom (projeção do mapa web) */
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
