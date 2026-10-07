// A folha do Gerar mapa: as medidas de cada papel e onde cada parte fica (título no alto, mapa no meio, rodapé embaixo).
// Tudo em milímetros: é o tamanho real do papel, e a tela e o arquivo desenham a mesma folha, só em escalas diferentes.

export type Paper = 'a4' | 'a3'
export type Orientation = 'landscape' | 'portrait'
export type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface Rect { x: number; y: number; w: number; h: number }

/** o modelo da folha: um mapa, dois lado a lado, ou um mapa grande com detalhes de perto (DESIGN.md 13.9) */
export const SHEET_MODELS = ['single', 'side', 'details'] as const
export type SheetModel = (typeof SHEET_MODELS)[number]
export const SHEET_MODEL_LABELS: Record<SheetModel, string> = { single: 'Um mapa', side: 'Lado a lado', details: 'Mapa e detalhes' }
export const DEFAULT_SHEET_MODEL: SheetModel = 'single'
export const DETAIL_COUNTS = [1, 2, 3, 4] as const
export const DEFAULT_DETAIL_COUNT = 3

/** um mapa dentro da folha: o principal (com grade, norte, legenda e localização) ou um dos outros (só o mapa, a etiqueta e a escala) */
export interface Panel {
  id: string
  /** a etiqueta que aparece no painel e no mapa grande ("A", "B", "1"…); o mapa grande do modelo com detalhes não tem */
  label: string | null
  rect: Rect
  main: boolean
}

export interface Sheet {
  width: number
  height: number
  header: Rect
  /** o mapa principal (o quadro com borda); a grade pode ter números na margem em volta dele */
  map: Rect
  /** todos os mapas da folha, o principal primeiro; no modelo de um mapa é só ele */
  panels: Panel[]
  footer: Rect
  /** a coluna ao lado do mapa (legenda e texto), só na folha deitada com a legenda fora; null nos outros casos */
  side: Rect | null
  /** a faixa da legenda embaixo dos mapas; null quando a legenda não está embaixo (ou não tem nada) */
  band: Rect | null
  /** a margem em volta do mapa para os números da grade (mm); 0 quando os números ficam dentro */
  gridMargin: number
}

/** o que o conteúdo pede da folha: cada pedido tira um pouco de área do mapa */
export interface SheetOptions {
  /** a coluna ao lado dos mapas (legenda e/ou texto): só vale na folha deitada */
  side?: boolean
  /** a faixa da legenda embaixo dos mapas, na largura toda; `legendRows` (linhas da legenda) dá a altura dela */
  below?: boolean
  legendRows?: number
  gridMargin?: boolean
  model?: SheetModel
  /** quantos detalhes no modelo Mapa e detalhes */
  details?: number
  /** o título quebrou em duas linhas: a faixa cresce para ele e a linha de apoio não encostarem nas bordas */
  headerLines?: 1 | 2
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
const HEADER = 22 // a faixa do título: título e linha de apoio
const HEADER_TALL = 28 // a faixa quando o título ocupa duas linhas
const FOOTER = 10 // datum e crédito da base
const GAP = 3 // respiro entre título, mapa e rodapé
export const SIDE_W = 62 // coluna ao lado do mapa: a legenda vale esta largura no papel

// A faixa da legenda embaixo: o mesmo cartão da legenda, desenhado menor (0,2 mm por unidade de desenho) e em colunas. A altura vem de
// quantas linhas a legenda tem e de quantas colunas cabem na largura da folha.
export const BAND_K = 0.2 // mm por unidade de desenho (a legenda ao lado usa 62/220, cerca de 0,28)
export const BAND_ROW_DESIGN = 28 // altura de uma linha da legenda, em unidades de desenho
export const BAND_HEAD_DESIGN = 34 // a tira do título
export const BAND_PAD_DESIGN = 12
const BAND_COLUMN_MM = 62 // largura de uma coluna da faixa
export const LEGEND_PLACES = ['over', 'side', 'below'] as const
export type LegendPlace = (typeof LEGEND_PLACES)[number]
export const LEGEND_PLACE_LABELS: Record<LegendPlace, string> = { over: 'Sobre o mapa', side: 'Ao lado', below: 'Embaixo' }

/** quantas colunas a faixa tem nesta largura de folha (de 2 a 5) */
export const bandColumns = (innerMm: number) => Math.min(5, Math.max(2, Math.floor(innerMm / BAND_COLUMN_MM)))

/** a altura da faixa para uma legenda de `rows` linhas; 0 quando não há legenda */
export function bandHeight(rows: number, innerMm: number): number {
  if (!(rows > 0)) return 0
  // meia linha de folga por coluna: os itens não se partem ao meio, então o fim de uma coluna pode sobrar um pouco
  const perColumn = Math.ceil(rows / bandColumns(innerMm)) + 0.6
  return (BAND_HEAD_DESIGN + BAND_PAD_DESIGN * 2 + perColumn * BAND_ROW_DESIGN) * BAND_K
}
const GRID_MARGIN = 7 // onde moram os números da grade quando ficam fora do mapa

// O tamanho do título na faixa, em mm: o maior que cabe. Até 6,5 mm é uma linha só; menor que isso (5,5 mm) pode passar a duas linhas,
// que é o que a faixa de 22 mm comporta junto da linha de apoio. Passou disso, o texto corta com reticências (line-clamp).
const TITLE_STEPS: { size: number; lines: number }[] = [{ size: 7.5, lines: 1 }, { size: 6.5, lines: 1 }, { size: 5.5, lines: 2 }]
const TITLE_CHAR_W = 0.56 // largura média de uma letra da Plex 600, em fração do tamanho

export const HEADER_PAD_MM = 6 // respiro dos lados da faixa do título
export const LOGO_SLOT_MM = 19 // o logo (15 mm) mais o espaço até o título

/** quantas linhas o título ocupa na faixa desta folha (o logo come largura): o layout e a faixa usam a mesma conta */
export function titleLayout(text: string, paper: Paper, orientation: Orientation, hasLogo: boolean, centered = false): { size: number; lines: number } {
  const inner = sheetLayout(paper, orientation).header.w
  // centralizado com logo, o texto reserva o espaço do logo dos dois lados: assim o centro dele é o centro da faixa
  const logo = hasLogo ? LOGO_SLOT_MM * (centered ? 2 : 1) : 0
  return titleFit(text, inner - HEADER_PAD_MM * 2 - logo)
}

export function titleFit(text: string, availMm: number): { size: number; lines: number } {
  const len = text.trim().length
  const fit = TITLE_STEPS.find((s) => Math.ceil((len * s.size * TITLE_CHAR_W) / Math.max(1, availMm)) <= s.lines)
  return fit ?? TITLE_STEPS[TITLE_STEPS.length - 1]
}

export function sheetLayout(paper: Paper, orientation: Orientation, options: SheetOptions = {}): Sheet {
  const { w, h } = PAPER_MM[paper]
  const width = orientation === 'landscape' ? h : w
  const height = orientation === 'landscape' ? w : h
  const inner = width - MARGIN * 2
  const header: Rect = { x: MARGIN, y: MARGIN, w: inner, h: options.headerLines === 2 ? HEADER_TALL : HEADER }
  const footer: Rect = { x: MARGIN, y: height - MARGIN - FOOTER, w: inner, h: FOOTER }
  const top = header.y + header.h + GAP
  const area: Rect = { x: MARGIN, y: top, w: inner, h: footer.y - GAP - top }
  const model = options.model ?? DEFAULT_SHEET_MODEL
  // a legenda ao lado (coluna) vale em qualquer modelo, na folha deitada; embaixo (faixa) vale em qualquer folha
  const sideOn = !!options.side && orientation === 'landscape'
  if (sideOn) area.w -= SIDE_W + GAP
  const bandH = options.below && !sideOn ? bandHeight(options.legendRows ?? 0, inner) : 0
  const band: Rect | null = bandH > 0 ? { x: MARGIN, y: area.y + area.h - bandH, w: inner, h: bandH } : null
  if (band) area.h -= bandH + GAP
  const gridMargin = options.gridMargin ? GRID_MARGIN : 0
  const pad = (r: Rect): Rect => ({ x: r.x + gridMargin, y: r.y + gridMargin, w: r.w - gridMargin * 2, h: r.h - gridMargin * 2 })
  const wide = orientation === 'landscape'

  // cada modelo reparte a área; só o mapa principal leva a margem da grade (os números ficam fora dele)
  let main: Rect
  const others: Panel[] = []
  let mainPanel: Omit<Panel, 'rect'> = { id: 'main', label: null, main: true }
  if (model === 'side') {
    const half = wide ? { w: (area.w - GAP) / 2, h: area.h } : { w: area.w, h: (area.h - GAP) / 2 }
    main = pad({ x: area.x, y: area.y, ...half })
    // o id do principal é sempre 'main': ao trocar de modelo o mesmo mapa continua montado e não perde onde a pessoa o deixou
    mainPanel = { id: 'main', label: 'A', main: true }
    // os dois levam a margem da grade (cada um tem os seus números, e as coordenadas de um não valem para o outro)
    others.push({ id: 'B', label: 'B', main: false, rect: pad({ x: wide ? area.x + half.w + GAP : area.x, y: wide ? area.y : area.y + half.h + GAP, ...half }) })
  } else if (model === 'details') {
    const n = Math.min(4, Math.max(1, Math.round(options.details ?? DEFAULT_DETAIL_COUNT)))
    // a coluna (folha deitada) ou a faixa (em pé) dos detalhes: um quarto da área, mais ou menos
    const strip = wide ? Math.round(area.w * 0.24) : Math.round(area.h * 0.26)
    main = pad(wide ? { x: area.x, y: area.y, w: area.w - strip - GAP, h: area.h } : { x: area.x, y: area.y, w: area.w, h: area.h - strip - GAP })
    const span = ((wide ? area.h : area.w) - GAP * (n - 1)) / n
    for (let i = 0; i < n; i++) {
      others.push({
        id: `d${i + 1}`,
        label: String(i + 1),
        main: false,
        rect: wide ? { x: area.x + area.w - strip, y: area.y + i * (span + GAP), w: strip, h: span } : { x: area.x + i * (span + GAP), y: area.y + area.h - strip, w: span, h: strip },
      })
    }
  } else {
    main = pad(area)
  }
  const side: Rect | null = sideOn ? { x: MARGIN + inner - SIDE_W, y: main.y, w: SIDE_W, h: main.h } : null
  return { width, height, header, map: main, panels: [{ ...mainPanel, rect: main }, ...others], footer, side, band, gridMargin }
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
