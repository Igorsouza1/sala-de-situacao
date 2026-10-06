import buffer from '@turf/buffer'
import union from '@turf/union'
import { featureCollection, point } from '@turf/helpers'
import type { Feature, MultiPolygon, Polygon } from 'geojson'

// A mancha de um grupo de ações (DESIGN.md 13.4): o contorno do que os pontos ocupam no mapa, para a pessoa ver ONDE as ações
// agrupadas estão e QUANTO espaço ocupam (o cartão "25 ações" sozinho não diz). É a união de um círculo em volta de cada ponto.

const EQUATOR_METERS_PER_PIXEL_AT_Z0 = 156543.03392

/** quantos metros cabem em um pixel, nesta latitude e neste zoom (projeção do mapa web) */
export const metersPerPixel = (lat: number, zoom: number) =>
  (EQUATOR_METERS_PER_PIXEL_AT_Z0 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom

/**
 * União dos círculos de `radiusPx` pixels (no zoom e latitude dados) em volta de cada ponto.
 * O raio é em pixels, e não em metros, para a mancha aparecer em qualquer zoom: num zoom longe, 150 m seriam menores que um pixel.
 */
export function clusterFootprint(coords: [number, number][], radiusPx: number, zoom: number): Feature<Polygon | MultiPolygon> | null {
  if (coords.length === 0) return null
  // pontos repetidos (várias ações no mesmo lugar) viram um círculo só
  const unique = [...new Map(coords.map((c) => [`${c[0].toFixed(6)},${c[1].toFixed(6)}`, c])).values()]
  const meanLat = unique.reduce((sum, c) => sum + c[1], 0) / unique.length
  const radiusKm = (radiusPx * metersPerPixel(meanLat, zoom)) / 1000
  const circles = unique
    .map((c) => buffer(point(c), radiusKm, { units: 'kilometers', steps: 16 }))
    .filter((f): f is Feature<Polygon> => !!f)
  if (circles.length === 0) return null
  if (circles.length === 1) return circles[0]
  return union(featureCollection(circles))
}
