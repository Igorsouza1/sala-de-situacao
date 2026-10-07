import type { SheetModel } from './sheet'

// De onde cada painel parte (DESIGN.md 13.9): a pessoa não escolhe câmera nenhuma ao trocar de modelo; o sistema propõe e ela ajusta
// arrastando o painel.

export interface PanelCamera { lng: number; lat: number; zoom: number }

export const DETAIL_ZOOM_STEP = 2 // o detalhe nasce com dois níveis a mais de zoom que o mapa grande (quatro vezes mais perto)
const SPREAD = 0.24 // a distância entre os centros dos detalhes, em fração da largura do mapa grande: 4 cabem sem sair dele

/** a largura (em graus de longitude) que o mapa mostra com este zoom e esta largura em pixels */
export const spanLng = (zoom: number, widthPx: number) => (widthPx * 360) / (512 * 2 ** zoom)

/**
 * A câmera inicial de um painel que não é o principal. Lado a lado parte da mesma vista do mapa principal; os detalhes partem mais perto
 * e espalhados em linha pelo meio do mapa grande (o `index` conta de 0), para não nascerem todos no mesmo lugar.
 */
export function seedCamera(model: SheetModel, index: number, count: number, main: PanelCamera, mainWidthPx: number): PanelCamera {
  if (model !== 'details') return { ...main }
  const offset = (index - (count - 1) / 2) * SPREAD * spanLng(main.zoom, mainWidthPx)
  return { lng: main.lng + offset, lat: main.lat, zoom: main.zoom + DETAIL_ZOOM_STEP }
}

export interface Bounds { west: number; south: number; east: number; north: number }

/** o retângulo de um detalhe sobre o mapa grande: se o detalhe não está à vista, não há o que desenhar */
export function coverageRect(bounds: Bounds, project: (lng: number, lat: number) => { x: number; y: number }): { x: number; y: number; w: number; h: number } {
  const a = project(bounds.west, bounds.north)
  const b = project(bounds.east, bounds.south)
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) }
}
