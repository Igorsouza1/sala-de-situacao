import { BASEMAP_KEYS, type BasemapKey } from './basemaps'
import type { AreaFilter, DateIntent, PresetId } from './filters'
import { DEFAULT_SHOW, PART_IDS, PRINT_BASEMAPS, type Part } from './gerar-mapa'
import type { GridFormat } from './grid'
import { CORNERS, DEFAULT_LEGEND_CORNER, DEFAULT_SHEET, ORIENTATIONS, PAPERS, type Corner, type Orientation, type Paper } from './sheet'

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
  basemap?: BasemapKey
  coords?: GridFormat
  legendCorner?: Corner
  /** só as partes que a pessoa mexeu; o resto vem do padrão */
  show?: Partial<Record<Part, boolean>>
}

const GERAR_KEY = 'prisma:mapa:gerar'
const COORD_FORMATS: GridFormat[] = ['dms', 'utm']

export function readGerarPrefs(store: Store | null = browserStore()): GerarPrefs {
  try {
    const raw = store?.getItem(GERAR_KEY)
    if (!raw) return {}
    const json = JSON.parse(raw)
    if (json?.v !== VERSION) return {}
    const prefs: GerarPrefs = {}
    if (PAPERS.includes(json.paper)) prefs.paper = json.paper
    if (ORIENTATIONS.includes(json.orientation)) prefs.orientation = json.orientation
    if (PRINT_BASEMAPS.includes(json.basemap)) prefs.basemap = json.basemap
    if (COORD_FORMATS.includes(json.coords)) prefs.coords = json.coords
    if (CORNERS.includes(json.legendCorner)) prefs.legendCorner = json.legendCorner
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
    for (const k of ['paper', 'orientation', 'basemap', 'coords', 'legendCorner', 'show'] as const) {
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
  return PART_IDS.some((id) => p.show?.[id] !== undefined && p.show[id] !== DEFAULT_SHOW[id])
}
