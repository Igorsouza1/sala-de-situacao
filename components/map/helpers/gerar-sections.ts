import type { LegendPlace, Orientation, SheetModel } from './sheet'

// A estrutura do painel do Gerar mapa: as seções na ordem em que a folha se lê, de cima para baixo (DESIGN.md 13.9), e o que o
// sistema propõe sozinho quando a pessoa ainda não escolheu nada.

export const SECTION_IDS = ['folha', 'cabecalho', 'textos', 'mapa', 'legenda'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  folha: 'Folha',
  cabecalho: 'Cabeçalho',
  mapa: 'Mapa',
  legenda: 'Legenda',
  textos: 'Textos',
}

/**
 * O que se toca na folha ao vivo para ir ao ajuste: a seção e o nome na etiqueta. Só entra quem tem o que ajustar além de ligar e
 * desligar (a escala e o mapa de localização só têm o interruptor: se tocar não leva a ajuste nenhum, não é clicável).
 */
export const SHEET_TARGETS = {
  titulo: { section: 'cabecalho', tag: 'Título' },
  legenda: { section: 'legenda', tag: 'Legenda' },
  norte: { section: 'mapa', tag: 'Seta do norte' },
} as const satisfies Record<string, { section: SectionId; tag: string }>
export type SheetTarget = keyof typeof SHEET_TARGETS

export const isSheetTarget = (v: unknown): v is SheetTarget => typeof v === 'string' && v in SHEET_TARGETS

// ── O que o sistema propõe ──────────────────────────────────────────────────────────────────────────────────────────
export const LONG_LEGEND_ROWS = 8 // a legenda com tantas linhas ou mais pede a coluna ao lado
export const CLOSE_ZOOM = 11 // de tão perto, a folha mostra pouco do entorno: o mapa de localização diz onde fica

export interface AutoSheet {
  orientation: Orientation
  inset: boolean
}

/**
 * Onde a legenda fica quando a pessoa não escolheu: com mais de um mapa, embaixo (na faixa; sobre o mapa ela tapa metade dele); com um
 * mapa, ao lado se a folha é deitada e a legenda é longa, senão sobre o mapa.
 */
export function autoLegendPlace(model: SheetModel, orientation: Orientation, legendRows: number): LegendPlace {
  if (model !== 'single') return 'below'
  return orientation === 'landscape' && legendRows >= LONG_LEGEND_ROWS ? 'side' : 'over'
}

/**
 * A folha que combina com o mapa que a pessoa estava vendo: em pé se o trecho é mais alto que largo, deitada nos outros casos; a
 * legenda ao lado quando a folha é deitada e a legenda é longa; o mapa de localização quando o zoom está perto.
 */
export function autoSheet(input: { viewport: { w: number; h: number }; zoom: number }): AutoSheet {
  const { viewport, zoom } = input
  const orientation: Orientation = viewport.h > viewport.w * 1.1 ? 'portrait' : 'landscape'
  return { orientation, inset: zoom >= CLOSE_ZOOM }
}

/** a seção que está à vista: a última cujo topo já passou da linha de leitura; no fim da rolagem, a última */
export function activeSection(tops: Record<SectionId, number>, scrollTop: number, atEnd: boolean): SectionId {
  if (atEnd) return SECTION_IDS[SECTION_IDS.length - 1]
  let current: SectionId = SECTION_IDS[0]
  for (const id of SECTION_IDS) if (tops[id] <= scrollTop + 24) current = id
  return current
}
