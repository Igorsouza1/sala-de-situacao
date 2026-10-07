import { BASEMAP_KEYS, type BasemapKey } from './basemaps'
import type { AreaFilter, DateIntent, PresetId } from './filters'
import { BLOCK_FONTS, BLOCK_SIZES, BLOCK_STYLES, MAX_BLOCKS, MAX_BLOCK_CHARS, clampPos, type MapBlock, TITLE_ALIGNS, type TitleAlign, DEFAULT_GRID_LEVEL, DEFAULT_GRID_NUMBERS, DEFAULT_MARKER_LOOK, DEFAULT_NORTH_STYLE, DEFAULT_SHOW, GRID_NUMBERS, MARKER_LOOKS, NORTH_STYLES, PART_IDS, PRINT_BASEMAPS, clampGridLevel, type GridNumbers, type MarkerLook, type NorthStyle, type Part } from './gerar-mapa'
import type { GridFormat } from './grid'
import { isLegendOpacity, type LegendOpacity } from './legend-opacity'
import { CORNERS, DEFAULT_LEGEND_CORNER, DEFAULT_SHEET, DETAIL_COUNTS, LEGEND_PLACES, ORIENTATIONS, PAPERS, SHEET_MODELS, type Corner, type LegendPlace, type Orientation, type Paper, type SheetModel } from './sheet'

// Preferências do mapa, guardadas no navegador (DESIGN.md 13.2): a mesma pessoa, no mesmo aparelho, abre o mapa como o deixou.
// Fica tudo neste módulo de propósito: quando as preferências do usuário forem para o banco (junto com som e cursor, 17.4),
// troca-se só o armazenamento daqui, e o mapa não percebe.
//
// - A base do mapa vale para todas as regiões (uma chave só).
// - Camadas, filtros e câmera valem por região: as camadas mudam de uma região para outra, e o zoom de uma não serve na outra.
// - Cada campo é validado na leitura: um valor estranho (versão antiga, edição à mão) vira "não salvo", nunca um erro.

export interface Camera {
  lng: number
  lat: number
  zoom: number
}

export interface RegionPrefs {
  layers?: string[]
  fauna?: { heatmap: boolean; locations: boolean }
  date?: DateIntent
  area?: AreaFilter
  camera?: Camera
}

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const VERSION = 1
const BASE_KEY = 'prisma:mapa:base'
const regionKey = (regiaoId?: number) => `prisma:mapa:regiao:${regiaoId ?? 'padrao'}`

const browserStore = (): Store | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const PRESET_IDS: PresetId[] = ['today', 'week', 'month', 'year']

function cleanDate(v: any): DateIntent | undefined {
  if (!v || typeof v !== 'object') return undefined
  if (v.kind === 'none') return { kind: 'none' }
  if (v.kind === 'preset' && PRESET_IDS.includes(v.id)) return { kind: 'preset', id: v.id }
  if (v.kind === 'year' && Number.isInteger(v.year) && v.year > 1900 && v.year < 2200) return { kind: 'year', year: v.year }
  if (v.kind === 'range') {
    const ok = (s: unknown) => s === null || (typeof s === 'string' && !Number.isNaN(Date.parse(s)))
    if (ok(v.start) && ok(v.end) && (v.start !== null || v.end !== null)) return { kind: 'range', start: v.start, end: v.end }
  }
  return undefined
}

function cleanArea(v: any): AreaFilter | undefined {
  if (!v || typeof v !== 'object') return undefined
  const area: AreaFilter = {}
  if (isNum(v.minArea) && v.minArea >= 0) area.minArea = v.minArea
  if (isNum(v.maxArea) && v.maxArea >= 0) area.maxArea = v.maxArea
  return area
}

function cleanCamera(v: any): Camera | undefined {
  if (!v || !isNum(v.lng) || !isNum(v.lat) || !isNum(v.zoom)) return undefined
  if (Math.abs(v.lat) > 90 || Math.abs(v.lng) > 180 || v.zoom < 0 || v.zoom > 24) return undefined
  return { lng: v.lng, lat: v.lat, zoom: v.zoom }
}

export function readRegionPrefs(regiaoId?: number, store: Store | null = browserStore()): RegionPrefs {
  try {
    const raw = store?.getItem(regionKey(regiaoId))
    if (!raw) return {}
    const json = JSON.parse(raw)
    if (json?.v !== VERSION) return {}
    const prefs: RegionPrefs = {}
    if (Array.isArray(json.layers) && json.layers.every((s: unknown) => typeof s === 'string')) prefs.layers = json.layers
    if (json.fauna && typeof json.fauna.heatmap === 'boolean' && typeof json.fauna.locations === 'boolean') {
      prefs.fauna = { heatmap: json.fauna.heatmap, locations: json.fauna.locations }
    }
    const date = cleanDate(json.date)
    if (date) prefs.date = date
    const area = cleanArea(json.area)
    if (area) prefs.area = area
    const camera = cleanCamera(json.camera)
    if (camera) prefs.camera = camera
    return prefs
  } catch {
    return {}
  }
}

// Junta o que mudou ao que já estava salvo: cada parte do mapa grava a sua sem apagar a das outras.
export function saveRegionPrefs(regiaoId: number | undefined, patch: RegionPrefs, store: Store | null = browserStore()): void {
  try {
    const next = { ...readRegionPrefs(regiaoId, store), ...patch }
    store?.setItem(regionKey(regiaoId), JSON.stringify({ v: VERSION, ...next }))
  } catch {
    /* sem armazenamento (janela privada, cheio): o mapa funciona igual, só não lembra */
  }
}

export function clearRegionPrefs(regiaoId?: number, store: Store | null = browserStore()): void {
  try {
    store?.removeItem(regionKey(regiaoId))
  } catch {
    /* idem */
  }
}

export function readBasemap(store: Store | null = browserStore()): BasemapKey | null {
  try {
    const v = store?.getItem(BASE_KEY)
    return BASEMAP_KEYS.includes(v as BasemapKey) ? (v as BasemapKey) : null
  } catch {
    return null
  }
}

export function saveBasemap(key: BasemapKey, store: Store | null = browserStore()): void {
  try {
    store?.setItem(BASE_KEY, key)
  } catch {
    /* idem */
  }
}

export function clearBasemap(store: Store | null = browserStore()): void {
  try {
    store?.removeItem(BASE_KEY)
  } catch {
    /* idem */
  }
}

// A câmera salva só vale se ainda cai dentro da região: quem se perdeu num canto, ou uma região que mudou de lugar,
// não deve abrir longe do território.
export const isInsideBounds = (c: Camera, bbox: [number, number, number, number]) =>
  c.lng >= bbox[0] && c.lng <= bbox[2] && c.lat >= bbox[1] && c.lat <= bbox[3]

// ── Gerar mapa ─────────────────────────────────────────────────────────────────────────────────────────────────────
// Quem faz o mesmo mapa toda semana não refaz as escolhas: papel, posição, coordenadas, canto da legenda, o que aparece e (se a pessoa
// escolheu um) o fundo voltam como ficaram. Título e textos da legenda NÃO ficam: dependem das camadas de cada dia e partem do automático.
// Vale para a pessoa neste aparelho, em todas as regiões (o papel e o gosto não mudam de uma região para outra).

export interface GerarPrefs {
  paper?: Paper
  orientation?: Orientation
  /** o modelo da folha (um mapa, lado a lado, mapa e detalhes) e quantos detalhes */
  model?: SheetModel
  details?: number
  basemap?: BasemapKey
  coords?: GridFormat
  legendCorner?: Corner
  /** onde a legenda fica: sobre o mapa, ao lado ou embaixo (só o que a pessoa escolheu) */
  legendPlace?: LegendPlace
  /** de antes do lugar da legenda: lido, nunca mais gravado */
  legendSide?: boolean
  /** o grau da linha da grade, de 0 (sem linha) a 4 */
  gridLevel?: number
  gridNumbers?: GridNumbers
  northStyle?: NorthStyle
  titleAlign?: TitleAlign
  /** o fundo da legenda sobre o mapa da folha */
  legendOpacity?: LegendOpacity
  markerLook?: MarkerLook
  /** os itens que a pessoa tirou da legenda (ids): voltam tirados da próxima vez */
  legendHidden?: string[]
  /** só as partes que a pessoa mexeu; o resto vem do padrão */
  show?: Partial<Record<Part, boolean>>
}

const GERAR_KEY = 'prisma:mapa:gerar'
const MAX_HIDDEN = 200
const COORD_FORMATS: GridFormat[] = ['dms', 'dd', 'utm']

export function readGerarPrefs(store: Store | null = browserStore()): GerarPrefs {
  try {
    const raw = store?.getItem(GERAR_KEY)
    if (!raw) return {}
    const json = JSON.parse(raw)
    if (json?.v !== VERSION) return {}
    const prefs: GerarPrefs = {}
    if (PAPERS.includes(json.paper)) prefs.paper = json.paper
    if (ORIENTATIONS.includes(json.orientation)) prefs.orientation = json.orientation
    if (SHEET_MODELS.includes(json.model)) prefs.model = json.model
    if ((DETAIL_COUNTS as readonly number[]).includes(json.details)) prefs.details = json.details
    if (PRINT_BASEMAPS.includes(json.basemap)) prefs.basemap = json.basemap
    if (COORD_FORMATS.includes(json.coords)) prefs.coords = json.coords
    if (Array.isArray(json.legendHidden)) prefs.legendHidden = json.legendHidden.filter((id: unknown) => typeof id === 'string').slice(0, MAX_HIDDEN)
    if (CORNERS.includes(json.legendCorner)) prefs.legendCorner = json.legendCorner
    if (typeof json.legendSide === 'boolean') prefs.legendSide = json.legendSide
    if (LEGEND_PLACES.includes(json.legendPlace)) prefs.legendPlace = json.legendPlace
    if (json.gridLevel !== undefined) prefs.gridLevel = clampGridLevel(json.gridLevel)
    if (GRID_NUMBERS.includes(json.gridNumbers)) prefs.gridNumbers = json.gridNumbers
    if (NORTH_STYLES.includes(json.northStyle)) prefs.northStyle = json.northStyle
    if (TITLE_ALIGNS.includes(json.titleAlign)) prefs.titleAlign = json.titleAlign
    if (isLegendOpacity(json.legendOpacity)) prefs.legendOpacity = json.legendOpacity
    if (MARKER_LOOKS.includes(json.markerLook)) prefs.markerLook = json.markerLook
    if (json.show && typeof json.show === 'object') {
      const show: Partial<Record<Part, boolean>> = {}
      for (const id of PART_IDS) if (typeof json.show[id] === 'boolean') show[id] = json.show[id]
      if (Object.keys(show).length > 0) prefs.show = show
    }
    return prefs
  } catch {
    return {}
  }
}

// Junta o que mudou ao que já estava salvo; só os campos conhecidos são gravados (título e textos nunca).
export function saveGerarPrefs(patch: GerarPrefs, store: Store | null = browserStore()): void {
  try {
    const known: GerarPrefs = {}
    for (const k of ['paper', 'orientation', 'model', 'details', 'basemap', 'coords', 'legendCorner', 'legendPlace', 'gridLevel', 'gridNumbers', 'northStyle', 'titleAlign', 'legendOpacity', 'markerLook', 'legendHidden', 'show'] as const) {
      if (patch[k] !== undefined) (known as any)[k] = patch[k]
    }
    store?.setItem(GERAR_KEY, JSON.stringify({ v: VERSION, ...readGerarPrefs(store), ...known }))
  } catch {
    /* sem armazenamento: o gerador funciona igual, só não lembra */
  }
}

export function clearGerarPrefs(store: Store | null = browserStore()): void {
  try {
    store?.removeItem(GERAR_KEY)
  } catch {
    /* idem */
  }
}

/** alguma escolha lembrada difere do padrão? É o que decide se a tela diz "usando suas últimas escolhas" */
export function isCustomGerar(p: GerarPrefs): boolean {
  if (p.paper !== undefined && p.paper !== DEFAULT_SHEET.paper) return true
  if (p.orientation !== undefined && p.orientation !== DEFAULT_SHEET.orientation) return true
  if (p.basemap !== undefined) return true
  if (p.coords !== undefined && p.coords !== 'dms') return true
  if (p.legendCorner !== undefined && p.legendCorner !== DEFAULT_LEGEND_CORNER) return true
  if (p.legendSide === true) return true
  if (p.gridLevel !== undefined && p.gridLevel !== DEFAULT_GRID_LEVEL) return true
  if (p.gridNumbers !== undefined && p.gridNumbers !== DEFAULT_GRID_NUMBERS) return true
  if (p.northStyle !== undefined && p.northStyle !== DEFAULT_NORTH_STYLE) return true
  if (p.markerLook !== undefined && p.markerLook !== DEFAULT_MARKER_LOOK) return true
  if (p.legendHidden && p.legendHidden.length > 0) return true
  return PART_IDS.some((id) => p.show?.[id] !== undefined && p.show[id] !== DEFAULT_SHOW[id])
}

// ── O conteúdo do Gerar mapa, por região ───────────────────────────────────────────────────────────────────────────
// Quem volta ao mapa encontra a folha como a deixou: o título escrito, os textos soltos (com o lugar e o jeito de cada um), os nomes e a
// ordem da legenda e as propriedades escolhidas. Só o logo não fica (é um arquivo da pessoa; nunca sai do aparelho nem é guardado). Vale
// por região porque o conteúdo é daquele mapa: o título de uma região não deve aparecer em outra. O título só é guardado se a pessoa o
// escreveu (o automático muda com as camadas de cada dia).

export interface GerarContent {
  /** o título que a pessoa escreveu; ausente: segue o automático */
  title?: string
  blocks?: MapBlock[]
  /** o jeito do último texto mexido: o próximo nasce com ele */
  look?: { style: MapBlock['style']; size: MapBlock['size']; font: MapBlock['font'] }
  legend?: { title: string; labels: Record<string, string>; order: string[] }
  propMode?: 'all' | 'some'
  props?: { id: number; nome: string }[]
}

const contentKey = (regiaoId?: number) => `prisma:mapa:gerar:conteudo:${regiaoId ?? 'padrao'}`
const MAX_LEGEND_ENTRIES = 200
const isStr = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max

function cleanBlocks(v: unknown): MapBlock[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: MapBlock[] = []
  for (const b of v.slice(0, MAX_BLOCKS)) {
    if (!b || typeof b !== 'object' || !isStr(b.id, 40) || typeof b.text !== 'string' || !isNum(b.x) || !isNum(b.y)) continue
    if (!BLOCK_STYLES.includes(b.style) || !BLOCK_SIZES.includes(b.size) || !BLOCK_FONTS.includes(b.font)) continue
    // texto vazio não sai no papel e só atrapalha ao voltar: não volta
    if (b.text.trim() === '') continue
    out.push({ id: b.id, text: b.text.slice(0, MAX_BLOCK_CHARS), x: clampPos(b.x), y: clampPos(b.y), style: b.style, size: b.size, font: b.font })
  }
  return out
}

export function readGerarContent(regiaoId?: number, store: Store | null = browserStore()): GerarContent {
  try {
    const raw = store?.getItem(contentKey(regiaoId))
    if (!raw) return {}
    const json = JSON.parse(raw)
    if (json?.v !== VERSION) return {}
    const out: GerarContent = {}
    if (isStr(json.title, 200) && json.title.trim() !== '') out.title = json.title
    const blocks = cleanBlocks(json.blocks)
    if (blocks && blocks.length > 0) out.blocks = blocks
    const l = json.look
    if (l && BLOCK_STYLES.includes(l.style) && BLOCK_SIZES.includes(l.size) && BLOCK_FONTS.includes(l.font)) out.look = { style: l.style, size: l.size, font: l.font }
    const g = json.legend
    if (g && typeof g === 'object' && isStr(g.title, 80)) {
      const labels: Record<string, string> = {}
      if (g.labels && typeof g.labels === 'object') {
        for (const [id, name] of Object.entries(g.labels).slice(0, MAX_LEGEND_ENTRIES)) if (isStr(name, 120) && name.trim() !== '') labels[id] = name
      }
      const order = Array.isArray(g.order) ? g.order.filter((id: unknown) => typeof id === 'string').slice(0, MAX_LEGEND_ENTRIES) : []
      out.legend = { title: g.title, labels, order }
    }
    if (json.propMode === 'all' || json.propMode === 'some') out.propMode = json.propMode
    if (Array.isArray(json.props)) {
      out.props = json.props.filter((p: any) => p && Number.isInteger(p.id) && isStr(p.nome, 200)).slice(0, MAX_LEGEND_ENTRIES).map((p: any) => ({ id: p.id, nome: p.nome }))
    }
    return out
  } catch {
    return {}
  }
}

/** grava o conteúdo inteiro desta região (o que não vem aqui deixa de ser lembrado) */
export function saveGerarContent(regiaoId: number | undefined, content: GerarContent, store: Store | null = browserStore()): void {
  try {
    store?.setItem(contentKey(regiaoId), JSON.stringify({ v: VERSION, ...content }))
  } catch {
    /* sem armazenamento: o gerador funciona igual, só não lembra */
  }
}
