// A organização das camadas de cada pessoa (DESIGN.md 13.1): uma pilha única, de cima para baixo, com pastas de um nível só.
// O que está em cima na lista está em cima no mapa. Uma pasta é um bloco da pilha: as camadas dela ficam juntas.
// Aqui mora só a conta, sem tela e sem mapa, para ser testada. Tudo é imutável e devolve o MESMO objeto quando nada muda.
//
// Ao contrário de `layer-order.ts` (de baixo para cima, como a pilha do MapLibre), as listas deste módulo vão DE CIMA PARA BAIXO,
// como a lista é lida. `stackFromLayout` faz a conversão para quem monta o mapa.

export interface LayoutLayer {
  slug: string
  /** cor escolhida pela pessoa; ausente: a do catálogo */
  color?: string
  /** 0.05 a 0.99; ausente: cheia */
  opacity?: number
}

export interface LayoutFolder {
  kind: 'folder'
  id: string
  name: string
  open: boolean
  /** vale para as camadas de dentro e multiplica a delas */
  opacity?: number
  /** as que estavam ligadas quando a pasta foi desligada: voltam quando ela for ligada */
  remembered?: string[]
  layers: LayoutLayer[]
}

export type LayoutItem = (LayoutLayer & { kind: 'layer' }) | LayoutFolder

export interface MapLayout {
  v: 1
  items: LayoutItem[]
}

/** O que o layout precisa saber de cada camada do catálogo. Quem chama deriva os dois sinalizadores. */
export interface CatalogLayer {
  slug: string
  category?: string
  /** no padrão fica no fundo (o raster importado: uma mancha de fogo não pode cobrir os alertas) */
  under?: boolean
  /** veio de arrastar um arquivo */
  imported?: boolean
}

export const CATEGORY_ORDER = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura', 'Uploads']
export const FALLBACK_CATEGORY = 'Outros'
export const MIN_OPACITY = 0.05
export const MAX_NAME = 60
const DEFAULT_FOLDER_NAME = 'Nova pasta'
const MAX_FOLDERS = 50
const MAX_LAYERS = 500
const HEX = /^#[0-9a-f]{6}$/i

const categoryId = (category: string) => `cat:${category}`
const isFolder = (i: LayoutItem): i is LayoutFolder => i.kind === 'folder'
const cleanName = (name: string) => name.trim().slice(0, MAX_NAME)

/** a opacidade guardada: apertada entre o mínimo e quase cheia; cheia (ou inválida) não se guarda */
function keptOpacity(v: unknown): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
  const o = Math.max(MIN_OPACITY, v)
  return o >= 1 ? undefined : o
}

const layerItem = (l: LayoutLayer): LayoutItem => ({ kind: 'layer', ...l })
const bare = (slug: string): LayoutLayer => ({ slug })

/** Uma pasta por categoria, na ordem de CATEGORY_ORDER (as outras depois, por nome). Dentro de cada uma vale o empilhamento do catálogo. */
export function defaultLayout(layers: CatalogLayer[]): MapLayout {
  const groups = new Map<string, CatalogLayer[]>()
  for (const l of layers) {
    const cat = l.category || FALLBACK_CATEGORY
    ;(groups.get(cat) ?? groups.set(cat, []).get(cat)!).push(l)
  }
  const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length)
  const names = [...groups.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
  return {
    v: 1,
    items: names.map((name): LayoutFolder => {
      // o catálogo vai de baixo para cima; a lista, de cima para baixo. O que fica no fundo desce até o fim da pasta.
      const list = groups.get(name)!
      const top = list.filter((l) => !l.under).reverse()
      const under = list.filter((l) => l.under).reverse()
      return { kind: 'folder', id: categoryId(name), name, open: true, layers: [...top, ...under].map((l) => bare(l.slug)) }
    }),
  }
}

/** As camadas de cima para baixo, como a lista é lida. */
export function flattenLayout(layout: MapLayout): string[] {
  return layout.items.flatMap((i) => (isFolder(i) ? i.layers.map((l) => l.slug) : [i.slug]))
}

/** As camadas de baixo para cima: a ordem em que a pilha do mapa é montada. */
export const stackFromLayout = (layout: MapLayout): string[] => flattenLayout(layout).reverse()

/**
 * Junta o que a pessoa organizou ao catálogo de agora: esquece o que saiu, ignora repetidas, e acomoda o que é novo.
 * Camada nova do catálogo vai para o fim da pasta da sua categoria, se a pessoa ainda a tem; senão cai solta no topo.
 * Importada por arrastar cai solta: o vetor no topo (é o que ela acabou de fazer), o raster no fim (não cobre os alertas).
 */
export function reconcileLayout(saved: MapLayout | undefined, layers: CatalogLayer[]): MapLayout {
  if (!saved) return defaultLayout(layers)
  const bySlug = new Map(layers.map((l) => [l.slug, l]))
  const seen = new Set<string>()
  const keep = (l: LayoutLayer) => bySlug.has(l.slug) && !seen.has(l.slug) && !!seen.add(l.slug)

  let changed = false
  const items: LayoutItem[] = []
  for (const item of saved.items) {
    if (isFolder(item)) {
      const kept = item.layers.filter(keep)
      if (kept.length !== item.layers.length) changed = true
      items.push(kept.length === item.layers.length ? item : { ...item, layers: kept })
    } else if (keep(item)) {
      items.push(item)
    } else {
      changed = true
    }
  }

  const added = layers.filter((l) => !seen.has(l.slug))
  if (added.length === 0 && !changed) return saved

  let next = items
  const top: LayoutItem[] = []
  const bottom: LayoutItem[] = []
  for (const l of added) {
    const folder = !l.imported ? next.find((i): i is LayoutFolder => isFolder(i) && i.id === categoryId(l.category || FALLBACK_CATEGORY)) : undefined
    if (folder) {
      next = next.map((i) => (i === folder ? { ...folder, layers: [...folder.layers, bare(l.slug)] } : i))
    } else if (l.imported && l.under) {
      bottom.push(layerItem(bare(l.slug)))
    } else {
      top.push(layerItem(bare(l.slug)))
    }
  }
  return { v: 1, items: [...top, ...next, ...bottom] }
}

export interface MoveTarget {
  /** a pasta de destino; null: solta, na pilha */
  folderId: string | null
  /** a posição na lista de destino, DEPOIS de tirar a camada de onde estava */
  index: number
}

const clampIndex = (i: number, length: number) => Math.max(0, Math.min(i, length))

/** Leva uma camada (com a cor e a opacidade que a pessoa escolheu) para uma pasta, ou para fora de qualquer pasta. */
export function moveLayer(layout: MapLayout, slug: string, to: MoveTarget): MapLayout {
  let found: LayoutLayer | undefined
  const stripped: LayoutItem[] = []
  for (const item of layout.items) {
    if (isFolder(item)) {
      const hit = item.layers.find((l) => l.slug === slug)
      if (hit) found = hit
      stripped.push(hit ? { ...item, layers: item.layers.filter((l) => l.slug !== slug) } : item)
    } else if (item.slug === slug) {
      const { kind: _kind, ...rest } = item
      found = rest
    } else {
      stripped.push(item)
    }
  }
  if (!found) return layout

  if (to.folderId === null) {
    const items = [...stripped]
    items.splice(clampIndex(to.index, items.length), 0, layerItem(found))
    return { v: 1, items }
  }
  const dest = stripped.find((i): i is LayoutFolder => isFolder(i) && i.id === to.folderId)
  if (!dest) return layout
  const layers = [...dest.layers]
  layers.splice(clampIndex(to.index, layers.length), 0, found)
  return { v: 1, items: stripped.map((i) => (i === dest ? { ...dest, layers } : i)) }
}

/** Muda a pasta de lugar na pilha; as camadas dela vão junto. A posição é a de depois de tirar a pasta. */
export function moveFolder(layout: MapLayout, folderId: string, index: number): MapLayout {
  const folder = layout.items.find((i): i is LayoutFolder => isFolder(i) && i.id === folderId)
  if (!folder) return layout
  const items = layout.items.filter((i) => i !== folder)
  items.splice(clampIndex(index, items.length), 0, folder)
  return { v: 1, items }
}

/**
 * Um passo para cima (-1) ou para baixo (+1), pelo teclado. Dentro de uma pasta anda uma posição; na ponta, sai dela. Na pilha, passa por
 * cima de uma camada solta ou de uma pasta fechada, e ENTRA numa pasta aberta (pelo começo se desce, pelo fim se sobe).
 */
export function stepLayer(layout: MapLayout, slug: string, delta: -1 | 1): MapLayout {
  const rootAt = layout.items.findIndex((i) => !isFolder(i) && i.slug === slug)
  if (rootAt >= 0) {
    const to = rootAt + delta
    const neighbor = layout.items[to]
    if (!neighbor) return layout
    if (isFolder(neighbor) && neighbor.open) {
      return moveLayer(layout, slug, { folderId: neighbor.id, index: delta > 0 ? 0 : neighbor.layers.length })
    }
    return moveLayer(layout, slug, { folderId: null, index: to })
  }
  const folderAt = layout.items.findIndex((i) => isFolder(i) && i.layers.some((l) => l.slug === slug))
  if (folderAt < 0) return layout
  const folder = layout.items[folderAt] as LayoutFolder
  const to = folder.layers.findIndex((l) => l.slug === slug) + delta
  if (to >= 0 && to < folder.layers.length) return moveLayer(layout, slug, { folderId: folder.id, index: to })
  return moveLayer(layout, slug, { folderId: null, index: delta < 0 ? folderAt : folderAt + 1 })
}

/** Um passo da pasta inteira, pelo teclado. Na ponta da pilha não faz nada. */
export function stepFolder(layout: MapLayout, id: string, delta: -1 | 1): MapLayout {
  const at = layout.items.findIndex((i) => isFolder(i) && i.id === id)
  const to = at + delta
  if (at < 0 || to < 0 || to >= layout.items.length) return layout
  return moveFolder(layout, id, to)
}

/** Cria a pasta no topo da pilha e leva para dentro dela as camadas pedidas, na ordem em que estavam na lista. */
export function createFolder(layout: MapLayout, id: string, name: string, slugs: string[] = []): MapLayout {
  if (layout.items.some((i) => isFolder(i) && i.id === id)) return layout
  const want = new Set(slugs)
  const order = flattenLayout(layout).filter((s) => want.has(s))
  const folder: LayoutFolder = { kind: 'folder', id, name: cleanName(name) || DEFAULT_FOLDER_NAME, open: true, layers: [] }
  let next: MapLayout = { v: 1, items: [folder, ...layout.items] }
  order.forEach((slug, i) => { next = moveLayer(next, slug, { folderId: id, index: i }) })
  return next
}

const updateFolder = (layout: MapLayout, id: string, patch: (f: LayoutFolder) => LayoutFolder): MapLayout => {
  const folder = layout.items.find((i): i is LayoutFolder => isFolder(i) && i.id === id)
  if (!folder) return layout
  const updated = patch(folder)
  return updated === folder ? layout : { v: 1, items: layout.items.map((i) => (i === folder ? updated : i)) }
}

/** "Nova pasta", e, se já existe, "Nova pasta 2", "Nova pasta 3"…: duas pastas com o mesmo nome na lista pareceriam um defeito. */
export function nextFolderName(layout: MapLayout, base = DEFAULT_FOLDER_NAME): string {
  const taken = new Set(layout.items.filter(isFolder).map((f) => f.name))
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) if (!taken.has(`${base} ${n}`)) return `${base} ${n}`
}

/**
 * Devolve uma pasta apagada ao lugar de onde saiu (o "Desfazer"). As camadas dela voltam para dentro, de onde estiverem agora;
 * as que sumiram do catálogo entretanto ficam de fora. Se já existe uma pasta com o mesmo id, nada muda.
 */
export function restoreFolder(layout: MapLayout, folder: LayoutFolder, index: number): MapLayout {
  if (layout.items.some((i) => isFolder(i) && i.id === folder.id)) return layout
  const here = new Set(flattenLayout(layout))
  const back = folder.layers.filter((l) => here.has(l.slug))
  const gone = new Set(back.map((l) => l.slug))
  const stripped = layout.items.flatMap((i): LayoutItem[] => {
    if (isFolder(i)) return [i.layers.some((l) => gone.has(l.slug)) ? { ...i, layers: i.layers.filter((l) => !gone.has(l.slug)) } : i]
    return gone.has(i.slug) ? [] : [i]
  })
  stripped.splice(clampIndex(index, stripped.length), 0, { ...folder, layers: back })
  return { v: 1, items: stripped }
}

export function renameFolder(layout: MapLayout, id: string, name: string): MapLayout {
  const clean = cleanName(name)
  if (!clean) return layout
  return updateFolder(layout, id, (f) => (f.name === clean ? f : { ...f, name: clean }))
}

export const setFolderOpen = (layout: MapLayout, id: string, open: boolean): MapLayout =>
  updateFolder(layout, id, (f) => (f.open === open ? f : { ...f, open }))

export function setFolderOpacity(layout: MapLayout, id: string, opacity: number | null): MapLayout {
  const kept = opacity === null ? undefined : keptOpacity(opacity)
  return updateFolder(layout, id, (f) => {
    if (f.opacity === kept) return f
    const { opacity: _old, ...rest } = f
    return kept === undefined ? rest : { ...rest, opacity: kept }
  })
}

/** Apaga a pasta; as camadas sobem para o lugar dela, na mesma ordem. Nada se perde. */
export function deleteFolder(layout: MapLayout, id: string): MapLayout {
  const folder = layout.items.find((i): i is LayoutFolder => isFolder(i) && i.id === id)
  if (!folder) return layout
  return { v: 1, items: layout.items.flatMap((i) => (i === folder ? folder.layers.map(layerItem) : [i])) }
}

export interface StylePatch {
  /** null: volta à cor do catálogo */
  color?: string | null
  /** null (ou 1): volta à cheia */
  opacity?: number | null
}

/** Guarda a cor e a opacidade que a pessoa quer ver numa camada. Não muda o catálogo: é só para ela. */
export function setLayerStyle(layout: MapLayout, slug: string, patch: StylePatch): MapLayout {
  if (typeof patch.color === 'string' && !HEX.test(patch.color)) return layout
  // devolve a MESMA camada quando nada muda, para quem chama saber que não houve mudança
  const restyle = <T extends LayoutLayer>(l: T): T => {
    const { color: _c, opacity: _o, ...rest } = l
    const color = patch.color === undefined ? l.color : (patch.color?.toLowerCase() ?? undefined)
    const opacity = patch.opacity === undefined ? l.opacity : (patch.opacity === null ? undefined : keptOpacity(patch.opacity))
    if (color === l.color && opacity === l.opacity) return l
    return { ...rest, ...(color !== undefined && { color }), ...(opacity !== undefined && { opacity }) } as T
  }
  let changed = false
  const items = layout.items.map((item): LayoutItem => {
    if (isFolder(item)) {
      const layers = item.layers.map((l) => (l.slug === slug ? restyle(l) : l))
      if (layers.every((l, i) => l === item.layers[i])) return item
      changed = true
      return { ...item, layers }
    }
    if (item.slug !== slug) return item
    const next = restyle(item)
    changed ||= next !== item
    return next
  })
  return changed ? { v: 1, items } : layout
}

/** O que a pessoa escolheu para esta camada (só dela; a pasta não entra). Vazio quando nada foi mexido. */
export function layerStyleOf(layout: MapLayout, slug: string): { color?: string; opacity?: number } {
  for (const item of layout.items) {
    const hit = isFolder(item) ? item.layers.find((l) => l.slug === slug) : item.slug === slug ? item : undefined
    if (hit) return { ...(hit.color !== undefined && { color: hit.color }), ...(hit.opacity !== undefined && { opacity: hit.opacity }) }
  }
  return {}
}

/** A opacidade escolhida para a pasta (ausente: cheia). */
export function folderOpacityOf(layout: MapLayout, id: string): number | undefined {
  const folder = layout.items.find((i): i is LayoutFolder => isFolder(i) && i.id === id)
  return folder?.opacity
}

/** A opacidade com que a camada se vê no mapa: a dela vezes a da pasta. */
export function effectiveOpacity(layout: MapLayout, slug: string): number {
  for (const item of layout.items) {
    if (isFolder(item)) {
      const hit = item.layers.find((l) => l.slug === slug)
      if (hit) return (hit.opacity ?? 1) * (item.opacity ?? 1)
    } else if (item.slug === slug) {
      return item.opacity ?? 1
    }
  }
  return 1
}

/**
 * O interruptor da pasta, como um plano: quais camadas ligar e quais desligar. Quem tem o mapa aplica, porque "ligada" depende da
 * camada (uma com grupos vale se algum grupo está ligado). Com alguma ligada, desliga todas e lembra quais eram; sem nenhuma, liga as
 * lembradas (as que ainda estão na pasta) ou, sem lembrança, todas.
 */
export function planFolderToggle(layout: MapLayout, id: string, isOn: (slug: string) => boolean): { layout: MapLayout; on: string[]; off: string[] } {
  const folder = layout.items.find((i): i is LayoutFolder => isFolder(i) && i.id === id)
  if (!folder || folder.layers.length === 0) return { layout, on: [], off: [] }
  const slugs = folder.layers.map((l) => l.slug)
  const lit = slugs.filter(isOn)
  if (lit.length > 0) {
    return { layout: updateFolder(layout, id, (f) => ({ ...f, remembered: lit })), on: [], off: lit }
  }
  const remembered = (folder.remembered ?? []).filter((s) => slugs.includes(s))
  return {
    layout: updateFolder(layout, id, ({ remembered: _r, ...rest }) => rest),
    on: remembered.length > 0 ? remembered : slugs,
    off: [],
  }
}

const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max

function parseLayer(v: any, seen: Set<string>): LayoutLayer | undefined {
  if (!v || typeof v !== 'object' || !isStr(v.slug, 200) || seen.has(v.slug)) return undefined
  seen.add(v.slug)
  const layer: LayoutLayer = { slug: v.slug }
  if (typeof v.color === 'string' && HEX.test(v.color)) layer.color = v.color.toLowerCase()
  const opacity = keptOpacity(v.opacity)
  if (opacity !== undefined) layer.opacity = opacity
  return layer
}

/** Lê o que veio do banco ou do navegador. Cada campo é validado: um valor estranho vira "não salvo", nunca um erro. */
export function parseLayout(raw: unknown): MapLayout | undefined {
  const json = raw as any
  if (!json || typeof json !== 'object' || json.v !== 1 || !Array.isArray(json.items)) return undefined
  const seen = new Set<string>()
  const folderIds = new Set<string>()
  const items: LayoutItem[] = []
  for (const it of json.items) {
    if (!it || typeof it !== 'object') continue
    if (it.kind === 'folder') {
      if (!isStr(it.id, 80) || folderIds.has(it.id) || folderIds.size >= MAX_FOLDERS || typeof it.name !== 'string' || !cleanName(it.name)) continue
      folderIds.add(it.id)
      const layers = (Array.isArray(it.layers) ? it.layers : []).map((l: unknown) => parseLayer(l, seen)).filter((l: LayoutLayer | undefined): l is LayoutLayer => !!l)
      const folder: LayoutFolder = { kind: 'folder', id: it.id, name: cleanName(it.name), open: it.open !== false, layers }
      const opacity = keptOpacity(it.opacity)
      if (opacity !== undefined) folder.opacity = opacity
      if (Array.isArray(it.remembered)) {
        const remembered = it.remembered.filter((s: unknown): s is string => typeof s === 'string')
        if (remembered.length > 0) folder.remembered = remembered.slice(0, MAX_LAYERS)
      }
      items.push(folder)
    } else if (it.kind === 'layer') {
      const layer = parseLayer(it, seen)
      if (layer) items.push(layerItem(layer))
    }
  }
  return { v: 1, items: items.slice(0, MAX_LAYERS) }
}
