// A folha do Gerar mapa: as medidas de cada papel e onde cada parte fica (título no alto, mapa no meio, rodapé embaixo).
// Tudo em milímetros: é o tamanho real do papel, e a tela e o arquivo desenham a mesma folha, só em escalas diferentes.

export type Paper = 'a4' | 'a3'
export type Orientation = 'landscape' | 'portrait'
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Rect { x: number; y: number; w: number; h: number }
export interface Sheet {
  width: number
  height: number
  header: Rect
  /** o mapa em si (o quadro com borda); a grade pode ter números na margem em volta dele */
  map: Rect
  footer: Rect
  /** a coluna ao lado do mapa (legenda e texto), só na folha deitada com a legenda fora; null nos outros casos */
  side: Rect | null
  /** a margem em volta do mapa para os números da grade (mm); 0 quando os números ficam dentro */
  gridMargin: number
}

/** o que o conteúdo pede da folha: cada pedido tira um pouco de área do mapa */
export interface SheetOptions {
  /** a coluna ao lado do mapa (legenda e/ou texto): só vale na folha deitada */
  side?: boolean
  gridMargin?: boolean
}

export const PAPERS: Paper[] = ['a4', 'a3']
export const PAPER_LABELS: Record<Paper, string> = { a4: 'A4', a3: 'A3' }
export const ORIENTATIONS: Orientation[] = ['landscape', 'portrait']
export const ORIENTATION_LABELS: Record<Orientation, string> = { landscape: 'Deitada', portrait: 'Em pé' }

// o padrão que vem marcado: o que a maioria imprime
export const DEFAULT_SHEET: { paper: Paper; orientation: Orientation } = { paper: 'a4', orientation: 'landscape' }

// largura x altura do papel em pé
const PAPER_MM: Record<Paper, { w: number; h: number }> = { a4: { w: 210, h: 297 }, a3: { w: 297, h: 420 } }

const MARGIN = 10 // borda do papel que a impressora não alcança de forma segura
const HEADER = 16 // título
const FOOTER = 14 // fonte, créditos e data
const GAP = 3 // respiro entre título, mapa e rodapé
export const SIDE_W = 62 // coluna ao lado do mapa: a legenda vale esta largura no papel
const GRID_MARGIN = 7 // onde moram os números da grade quando ficam fora do mapa

export function sheetLayout(paper: Paper, orientation: Orientation, options: SheetOptions = {}): Sheet {
  const { w, h } = PAPER_MM[paper]
  const width = orientation === 'landscape' ? h : w
  const height = orientation === 'landscape' ? w : h
  const inner = width - MARGIN * 2
  const header: Rect = { x: MARGIN, y: MARGIN, w: inner, h: HEADER }
  const footer: Rect = { x: MARGIN, y: height - MARGIN - FOOTER, w: inner, h: FOOTER }
  const top = header.y + header.h + GAP
  const area: Rect = { x: MARGIN, y: top, w: inner, h: footer.y - GAP - top }
  const sideOn = !!options.side && orientation === 'landscape'
  if (sideOn) area.w -= SIDE_W + GAP
  const gridMargin = options.gridMargin ? GRID_MARGIN : 0
  const map: Rect = { x: area.x + gridMargin, y: area.y + gridMargin, w: area.w - gridMargin * 2, h: area.h - gridMargin * 2 }
  const side: Rect | null = sideOn ? { x: MARGIN + inner - SIDE_W, y: map.y, w: SIDE_W, h: map.h } : null
  return { width, height, header, map, footer, side, gridMargin }
}

/** o retângulo de um elemento (legenda, seta…) encostado no canto do mapa, com `inset` de folga; nunca maior que o mapa */
export function cornerRect(map: Rect, corner: Corner, w: number, h: number, inset: number): Rect {
  const fw = Math.min(w, Math.max(0, map.w - inset * 2))
  const fh = Math.min(h, Math.max(0, map.h - inset * 2))
  const left = corner.endsWith('left')
  const top = corner.startsWith('top')
  return {
    x: left ? map.x + inset : map.x + map.w - inset - fw,
    y: top ? map.y + inset : map.y + map.h - inset - fh,
    w: fw,
    h: fh,
  }
}

interface Size { w: number; h: number }

/** o zoom que mantém à vista tudo o que a pessoa via na tela quando o mapa passa a caber numa moldura de outro tamanho */
export function zoomToFit(zoom: number, screen: Size, frame: Size): number {
  if (!(screen.w > 0 && screen.h > 0 && frame.w > 0 && frame.h > 0)) return zoom
  return zoom + Math.log2(Math.min(frame.w / screen.w, frame.h / screen.h))
}

// ── Os cantos do mapa ──────────────────────────────────────────────────────────────────────────────────────────────
// A legenda vai para o canto que a pessoa escolhe; seta do norte, escala e mapa de localização ocupam os outros três, de modo que
// nenhum encosta no outro (cada canto tem um elemento só).
export const CORNERS: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
export const CORNER_LABELS: Record<Corner, string> = {
  'top-left': 'Em cima, à esquerda',
  'top-right': 'Em cima, à direita',
  'bottom-left': 'Embaixo, à esquerda',
  'bottom-right': 'Embaixo, à direita',
}
export const DEFAULT_LEGEND_CORNER: Corner = 'bottom-right'

/** a posição CSS (em mm) de um elemento encostado num canto, com `inset` de folga */
export function cornerAnchor(corner: Corner, inset: number): { top?: number; bottom?: number; left?: number; right?: number } {
  return {
    [corner.startsWith('top') ? 'top' : 'bottom']: inset,
    [corner.endsWith('left') ? 'left' : 'right']: inset,
  }
}

// o canto que cada um prefere, na ordem; o primeiro livre vence (legenda escolhida primeiro, depois norte, escala e localização)
const PREFERRED: Record<'north' | 'scale' | 'inset', Corner[]> = {
  north: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
  scale: ['bottom-left', 'bottom-right', 'top-left', 'top-right'],
  inset: ['top-left', 'bottom-left', 'top-right', 'bottom-right'],
}

/** `legend` null: a legenda está fora do mapa (na coluna ao lado) e os quatro cantos ficam livres */
export function placeCorners(legend: Corner | null): { legend: Corner | null; north: Corner; scale: Corner; inset: Corner } {
  const taken = new Set<Corner>(legend ? [legend] : [])
  const pick = (who: 'north' | 'scale' | 'inset') => {
    const corner = PREFERRED[who].find((c) => !taken.has(c)) ?? PREFERRED[who][0]
    taken.add(corner)
    return corner
  }
  const north = pick('north')
  const scale = pick('scale')
  const inset = pick('inset')
  return { legend, north, scale, inset }
}
