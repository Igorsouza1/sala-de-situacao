import type { LayerManagerOption } from '../LayerManager'
import { isLayerOn } from './layers'
import type { RuleLegendSection } from './legend-rules'

// A legenda da folha (Gerar mapa): os mesmos itens da legenda do mapa, que a pessoa pode renomear, esconder e reordenar SÓ na folha.
// A amostra (cor, ícone, forma) é sempre a do mapa: editar a legenda nunca a faz divergir do que o mapa desenha (DESIGN.md 6.2, regra 5).

export const DEFAULT_LEGEND_TITLE = 'Legenda'

export type LegendSwatch =
  | { kind: 'layer'; option: LayerManagerOption }
  | { kind: 'color'; color: string }
  | { kind: 'icon'; iconName: string }

export interface LegendItem {
  id: string
  label: string
  swatch: LegendSwatch
  children: LegendItem[]
}
/** `title` nulo: a primeira lista, que não precisa de subtítulo debaixo do título da legenda */
export interface LegendSection {
  id: string
  title: string | null
  items: LegendItem[]
}

export interface LegendEdits {
  title: string
  /** nome na legenda, pelo id do item; vazio volta ao nome do mapa */
  labels: Record<string, string>
  /** ids escondidos da legenda (a camada continua no mapa) */
  hidden: string[]
  /** ids na ordem escolhida; a ordem vale entre irmãos, e o que não está aqui vai depois */
  order: string[]
}
/** quantas linhas a legenda ocupa (o título de seção conta como parte de uma): a faixa de baixo calcula a altura com isto */
export function legendRowCount(sections: LegendSection[]): number {
  const rows = (items: LegendItem[]): number => items.reduce((n, i) => n + 1 + rows(i.children), 0)
  // cada seção traz o respiro e o filete de cima (cerca de meia linha) e, se tem título, mais uma linha pequena
  return sections.reduce((n, s) => n + rows(s.items) + 0.6 + (s.title ? 0.6 : 0), 0)
}

export const EMPTY_LEGEND_EDITS: LegendEdits = { title: DEFAULT_LEGEND_TITLE, labels: {}, hidden: [], order: [] }

export const isLegendEdited = (e: LegendEdits) =>
  (e.title.trim() !== '' && e.title.trim() !== DEFAULT_LEGEND_TITLE) || Object.keys(e.labels).length > 0 || e.hidden.length > 0 || e.order.length > 0

const item = (option: LayerManagerOption, children: LegendItem[] = []): LegendItem => ({ id: `layer:${option.slug}`, label: option.label, swatch: { kind: 'layer', option }, children })

/** os itens da legenda do mapa, na ordem do mapa: o que está ligado, e nas camadas de pinos a cor e o ícone no lugar da camada */
export function buildLegend(options: LayerManagerOption[], activeLayers: string[], ruleLegends: Record<string, RuleLegendSection[]>): LegendSection[] {
  const on = options.filter((o) => isLayerOn(o.slug, activeLayers))
  const plain = on.filter((o) => !(ruleLegends[o.slug]?.length))
  const sections: LegendSection[] = []

  if (plain.length > 0) {
    sections.push({
      id: 'camadas',
      title: null,
      items: plain.map((o) =>
        item(
          o,
          (o.subOptions ?? []).filter((s) => activeLayers.includes(o.slug) || isLayerOn(s.slug, activeLayers)).map((s) => item(s)),
        ),
      ),
    })
  }

  for (const o of on) {
    for (const section of ruleLegends[o.slug] ?? []) {
      sections.push({
        id: `rule:${o.slug}:${section.title}`,
        title: `${section.title} dos pinos`,
        items: section.entries.map((e) => ({
          id: `rule:${o.slug}:${section.title}:${e.key}`,
          label: e.label,
          swatch: section.title === 'Cor' ? { kind: 'color', color: e.color ?? 'transparent' } : { kind: 'icon', iconName: e.iconName ?? 'map-pin' },
          children: [],
        })),
      })
    }
  }
  return sections
}

/** a legenda como vai para o papel: nomes trocados, itens escondidos tirados e a ordem escolhida (sem alterar a original) */
export function applyLegendEdits(sections: LegendSection[], edits: LegendEdits): LegendSection[] {
  const hidden = new Set(edits.hidden)
  const rank = new Map(edits.order.map((id, i) => [id, i]))
  const ordered = (items: LegendItem[]) =>
    items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => (rank.get(a.it.id) ?? Infinity) - (rank.get(b.it.id) ?? Infinity) || a.i - b.i)
      .map(({ it }) => it)
  const visit = (items: LegendItem[]): LegendItem[] =>
    ordered(items)
      .filter((it) => !hidden.has(it.id))
      .map((it) => ({ ...it, label: edits.labels[it.id]?.trim() || it.label, children: visit(it.children) }))
  return sections.map((s) => ({ ...s, items: visit(s.items) })).filter((s) => s.items.length > 0)
}

/** a nova ordem depois de os irmãos serem reordenados: os irmãos vão para o fim da lista, na ordem nova, e o resto não muda */
export const setSiblingOrder = (order: string[], siblings: string[]): string[] => [...order.filter((id) => !siblings.includes(id)), ...siblings]

/** sobe (-1) ou desce (1) um item entre os irmãos; nas pontas, fica onde está */
export function moveBy(siblings: string[], id: string, delta: -1 | 1): string[] {
  const at = siblings.indexOf(id)
  const to = at + delta
  if (at < 0 || to < 0 || to >= siblings.length) return siblings
  const next = [...siblings]
  ;[next[at], next[to]] = [next[to], next[at]]
  return next
}
