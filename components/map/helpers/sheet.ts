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
  map: Rect
  footer: Rect
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

export function sheetLayout(paper: Paper, orientation: Orientation): Sheet {
  const { w, h } = PAPER_MM[paper]
  const width = orientation === 'landscape' ? h : w
  const height = orientation === 'landscape' ? w : h
  const inner = width - MARGIN * 2
  const header: Rect = { x: MARGIN, y: MARGIN, w: inner, h: HEADER }
  const footer: Rect = { x: MARGIN, y: height - MARGIN - FOOTER, w: inner, h: FOOTER }
  const top = header.y + header.h + GAP
  const map: Rect = { x: MARGIN, y: top, w: inner, h: footer.y - GAP - top }
  return { width, height, header, map, footer }
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
