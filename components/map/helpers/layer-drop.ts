import { moveFolder, moveLayer, type MapLayout, type MoveTarget } from './layer-layout'

// Onde a camada (ou a pasta) cai, pela posição do ponteiro (DESIGN.md 13.1). Só a conta, sem tela: a tela mede as linhas e entrega a
// geometria; aqui se decide o destino. Funciona como as listas em árvore dos gerenciadores de arquivos: o vão entre duas linhas é o
// ponto de soltar, e no fim de uma pasta o recuo do ponteiro diz se a camada fica dentro dela ou sai.

/** Quanto o ponteiro precisa estar mais à direita da borda esquerda das linhas de dentro para a camada ficar na pasta, no fim dela. */
export const INDENT = 24

export interface RowInfo {
  /** `folder:<id>`, `layer:<slug>` ou `empty:<id>`: a mesma chave que a tela põe em cada linha */
  key: string
  /** `folder`: o cabeçalho; `layer`: uma camada; `empty`: a faixa de uma pasta aberta e vazia */
  kind: 'folder' | 'layer' | 'empty'
  /** a pasta da linha: ela mesma (cabeçalho e faixa) ou a que contém a camada; nulo para camada solta */
  folderId: string | null
  slug?: string
  /** a posição, na pilha, do bloco a que a linha pertence (a pasta inteira conta como um) */
  rootIndex: number
  /** a posição da camada dentro da sua pasta */
  indexInFolder?: number
  /** cabeçalho: está aberta; fechada, as camadas dela não são linhas */
  open?: boolean
  /** cabeçalho: quantas camadas tem */
  size?: number
}

export interface Rect {
  top: number
  bottom: number
  /** a borda esquerda das linhas deste cartão */
  left: number
}

export type DropRow = RowInfo & Rect

export type Dragging = { type: 'layer'; slug: string } | { type: 'folder'; id: string }

export type DropTarget =
  | { kind: 'layer'; slug: string; to: MoveTarget }
  | { kind: 'folder'; id: string; index: number }

export interface DropResult {
  target: DropTarget
  /** a linha que mostra onde cai; nulo quando cai DENTRO de uma pasta fechada (aí a pasta é que se destaca) */
  line: { y: number; inset: boolean } | null
  /** a pasta que recebe a camada (para se destacar), nulo se cai na pilha */
  folderId: string | null
  /** soltar aqui não muda nada */
  noop: boolean
}

/** As linhas que a lista mostra, de cima para baixo, sem geometria. */
export function visibleRows(layout: MapLayout): RowInfo[] {
  const rows: RowInfo[] = []
  layout.items.forEach((item, rootIndex) => {
    if (item.kind === 'layer') {
      rows.push({ key: `layer:${item.slug}`, kind: 'layer', folderId: null, slug: item.slug, rootIndex })
      return
    }
    rows.push({ key: `folder:${item.id}`, kind: 'folder', folderId: item.id, rootIndex, open: item.open, size: item.layers.length })
    if (!item.open) return
    if (item.layers.length === 0) rows.push({ key: `empty:${item.id}`, kind: 'empty', folderId: item.id, rootIndex })
    item.layers.forEach((l, indexInFolder) =>
      rows.push({ key: `layer:${l.slug}`, kind: 'layer', folderId: item.id, slug: l.slug, rootIndex, indexInFolder }),
    )
  })
  return rows
}

const midOf = (r: Rect) => (r.top + r.bottom) / 2

/** O vão onde o ponteiro está: o primeiro cuja linha tem o meio abaixo do ponteiro (de 0 a rows.length). */
function gapAt(rows: DropRow[], y: number): number {
  const i = rows.findIndex((r) => y < midOf(r))
  return i === -1 ? rows.length : i
}

const lineBetween = (prev: DropRow | undefined, next: DropRow | undefined): number =>
  prev && next ? (prev.bottom + next.top) / 2 : prev ? prev.bottom : next ? next.top : 0

export function resolveDrop(rows: DropRow[], dragging: Dragging, pointer: { x: number; y: number }): DropResult | null {
  if (rows.length === 0) return null
  return dragging.type === 'folder' ? resolveFolderDrop(rows, dragging.id, pointer.y) : resolveLayerDrop(rows, dragging.slug, pointer)
}

function resolveFolderDrop(rows: DropRow[], id: string, y: number): DropResult | null {
  const from = rows.find((r) => r.key === `folder:${id}`)
  if (!from) return null
  // os blocos da pilha: cada pasta (cabeçalho e camadas) é um; cada camada solta é um
  const blocks = new Map<number, { top: number; bottom: number }>()
  for (const r of rows) {
    const b = blocks.get(r.rootIndex)
    blocks.set(r.rootIndex, b ? { top: Math.min(b.top, r.top), bottom: Math.max(b.bottom, r.bottom) } : { top: r.top, bottom: r.bottom })
  }
  const ordered = [...blocks.entries()].sort((a, b) => a[0] - b[0])
  const hit = ordered.find(([, b]) => y < (b.top + b.bottom) / 2)
  const gap = hit ? hit[0] : ordered.length
  const index = gap > from.rootIndex ? gap - 1 : gap
  const before = ordered.find(([i]) => i === gap - 1)?.[1]
  const after = ordered.find(([i]) => i === gap)?.[1]
  const lineY = before && after ? (before.bottom + after.top) / 2 : before ? before.bottom : after ? after.top : 0
  return { target: { kind: 'folder', id, index }, line: { y: lineY, inset: false }, folderId: null, noop: index === from.rootIndex }
}

function resolveLayerDrop(rows: DropRow[], slug: string, pointer: { x: number; y: number }): DropResult | null {
  const from = rows.find((r) => r.kind === 'layer' && r.slug === slug)
  if (!from) return null
  const fromFolder = from.folderId
  const fromIndex = fromFolder === null ? from.rootIndex : (from.indexInFolder ?? 0)

  const finish = (folderId: string | null, rawIndex: number, line: DropResult['line']): DropResult => {
    // o índice pedido a `moveLayer` é o de depois de tirar a camada de onde estava
    const index = folderId === fromFolder && rawIndex > fromIndex ? rawIndex - 1 : rawIndex
    return { target: { kind: 'layer', slug, to: { folderId, index } }, line, folderId, noop: folderId === fromFolder && index === fromIndex }
  }

  // Sobre o meio de uma pasta FECHADA, a camada entra nela (no fim): é o único jeito de soltar numa pasta que não mostra as camadas.
  const hover = rows.find((r) => pointer.y >= r.top && pointer.y <= r.bottom)
  if (hover?.kind === 'folder' && !hover.open) {
    const h = hover.bottom - hover.top
    if (pointer.y > hover.top + h * 0.25 && pointer.y < hover.bottom - h * 0.25) return finish(hover.folderId, hover.size ?? 0, null)
  }

  const gap = gapAt(rows, pointer.y)
  const prev = rows[gap - 1]
  const next = rows[gap]
  const y = lineBetween(prev, next)
  const inside = (folderId: string, index: number) => finish(folderId, index, { y, inset: true })
  const onTop = (index: number) => finish(null, index, { y, inset: false })

  if (!prev) return onTop(0)
  // logo depois do cabeçalho de uma pasta aberta, ou da faixa dela vazia: é o começo da pasta
  if ((prev.kind === 'folder' && prev.open) || prev.kind === 'empty') return inside(prev.folderId!, 0)
  if (prev.kind === 'layer' && prev.folderId !== null) {
    const siblingNext = next?.kind === 'layer' && next.folderId === prev.folderId
    const after = (prev.indexInFolder ?? 0) + 1
    if (siblingNext) return inside(prev.folderId, after)
    // o último da pasta: o recuo do ponteiro diz se a camada fica nela ou sai para a pilha
    return pointer.x >= prev.left + INDENT ? inside(prev.folderId, after) : onTop(prev.rootIndex + 1)
  }
  // depois de uma camada solta ou de uma pasta fechada: na pilha, logo depois
  return onTop(prev.rootIndex + 1)
}

/** Faz o que `resolveDrop` decidiu. Soltar onde já estava devolve o MESMO layout. */
export function applyDrop(layout: MapLayout, target: DropTarget): MapLayout {
  const out = target.kind === 'layer' ? moveLayer(layout, target.slug, target.to) : moveFolder(layout, target.id, target.index)
  return JSON.stringify(out) === JSON.stringify(layout) ? layout : out
}
