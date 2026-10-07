'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, FileDown, MapPin, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Collapse } from '@/components/ui/collapse'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import { useRegion } from '@/context/RegionContext'
import type { LayerResponseDTO, MapFeatureCollection } from '@/types/map-dto'
import { LegendEditor } from './LegendEditor'
import { LogoPicker } from './LogoPicker'
import { NoteCard } from './NoteCard'
import type { LayerManagerOption } from './LayerManager'
import { PanelCard } from './PanelCard'
import { PropertyPicker, type PickedProperty } from './PropertyPicker'
import { ChoiceTiles } from './ChoiceTiles'
import { LegendOpacityPicker } from './LegendOpacityPicker'
import { DEFAULT_SHEET_LEGEND_OPACITY, type LegendOpacity } from './helpers/legend-opacity'
import { Notice, type NoticeData } from './Notice'
import { Segmented } from './Segmented'
import { SheetExport, type ExportJob } from './SheetExport'
import { SheetPage, layoutOf, type Camera, type Json, type SheetSettings, type Size } from './SheetPage'
import { controlItem } from './helpers/control-style'
import { collectAttributions, parseAttribution } from './helpers/attribution'
import {
  BASEMAP_LABELS,
  BASEMAP_SWATCH,
  DEM_MAX_ZOOM,
  DEM_TILES,
  HILLSHADE_BASEMAPS,
  STATIC_STYLES,
  hillshadePaint,
  loadMineralStyle,
  readMapTokens,
  tintMineral,
  type BasemapKey,
} from './helpers/basemaps'
import { exportFileName, exportSize, saveBlob, type ExportKind } from './helpers/export-sheet'
import {
  DEFAULT_GRID_LEVEL,
  DEFAULT_GRID_NUMBERS,
  DEFAULT_NORTH_STYLE,
  DEFAULT_TITLE_ALIGN,
  TITLE_ALIGNS,
  TITLE_ALIGN_LABELS,
  type TitleAlign,
  DEFAULT_SHOW,
  DEFAULT_LOOK,
  DEFAULT_MARKER_LOOK,
  MARKER_LOOK_LABELS,
  MARKER_LOOKS,
  GRID_LEVEL_LABELS,
  NORTH_LABELS,
  NORTH_STYLES,
  PRINT_BASEMAP_GROUPS,
  autoTitle,
  composeSheetStyle,
  printBasemapFor,
  type GridNumbers,
  type NorthStyle,
  type MarkerLook,
  MAX_BLOCKS,
  newBlock,
  type BlockLook,
  type MapBlock,
  type Part,
} from './helpers/gerar-mapa'
import { readGerarContent, readGerarPrefs, saveGerarContent, saveGerarPrefs } from './helpers/map-prefs'
import type { GridFormat } from './helpers/grid'
import { EMPTY_LEGEND_EDITS, applyLegendEdits, buildLegend, type LegendEdits, type LegendItem } from './helpers/legend-sheet'
import { SECTION_IDS, SECTION_LABELS, SHEET_TARGETS, activeSection, autoLegendPlace, autoSheet, type SectionId, type SheetTarget } from './helpers/gerar-sections'
import type { RuleLegendSection } from './helpers/legend-rules'
import { LEGEND_PLACES, LEGEND_PLACE_LABELS, type LegendPlace } from './helpers/sheet'
import { DEFAULT_DETAIL_COUNT, DEFAULT_SHEET_MODEL, DETAIL_COUNTS, SHEET_MODELS, SHEET_MODEL_LABELS, type SheetModel } from './helpers/sheet'
import { CORNERS, CORNER_LABELS, DEFAULT_LEGEND_CORNER, DEFAULT_SHEET, ORIENTATIONS, ORIENTATION_LABELS, PAPERS, PAPER_LABELS, placeCorners, type Corner, type Orientation, type Paper } from './helpers/sheet'

// Gerar mapa (DESIGN.md 13.9): uma tela sobre o mapa, com a folha ao vivo no meio e os ajustes ao lado. A folha mostra o que vai
// para o papel: o mapa que a pessoa estava vendo, enquadrado na proporção do papel, com título e créditos.

/** o que o mapa principal entrega ao abrir o gerador: um retrato do que a pessoa está vendo */
export interface GerarMapaSession {
  /** `map.getStyle()` no momento de abrir: as camadas de dados já desenhadas, com os dados dentro */
  snapshot: any
  /** de onde a pessoa estava olhando */
  camera: { lng: number; lat: number; zoom: number }
  /** tamanho da tela do mapa, em pixels: base para manter à vista o que se via */
  viewport: { w: number; h: number }
  basemap: BasemapKey
  /** as fontes do retrato que são dados da pessoa (o resto é só da tela) */
  dataSourceIds: string[]
  /** camadas de ícone: são marcadores HTML, não estão no estilo */
  iconLayers: { layer: LayerResponseDTO; data: MapFeatureCollection }[]
  layerNames: string[]
  /** a legenda do mapa de agora: de onde a legenda da folha parte */
  legend: { options: LayerManagerOption[]; activeLayers: string[]; ruleLegends: Record<string, RuleLegendSection[]> }
  /** a região do mapa: a busca de propriedades da folha olha só ela */
  regiaoId?: number
}

const PARTS: { id: Part; label: string }[] = [
  { id: 'grid', label: 'Grade com coordenadas' },
  { id: 'north', label: 'Seta do norte' },
  { id: 'scale', label: 'Escala' },
  { id: 'inset', label: 'Mapa de localização' },
  { id: 'datum', label: 'Datum e fuso' },
  { id: 'date', label: 'Data de hoje' },
]
// Os ladrilhos mostram o resultado (um exemplo, um desenho) acima do nome: a pessoa entende sem clicar (regra 1, 2.1)
const COORD_TILES: { value: GridFormat; label: string; preview: ReactNode }[] = [
  { value: 'dms', label: 'Graus', preview: <span className="font-mono text-[11px]">56°41′05″</span> },
  { value: 'dd', label: 'Decimal', preview: <span className="font-mono text-[11px]">-56,6947°</span> },
  { value: 'utm', label: 'UTM', preview: <span className="font-mono text-[11px]">547.000</span> },
]
const frameIcon = (frame: { x: number; y: number; w: number; h: number }, ticks: string) => (
  <svg viewBox="0 0 40 24" className="h-6 w-10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <rect x={frame.x} y={frame.y} width={frame.w} height={frame.h} rx="1" />
    <path d={ticks} />
  </svg>
)
const NUMBER_TILES: { value: GridNumbers; label: string; preview: ReactNode }[] = [
  { value: 'margin', label: 'Na margem', preview: frameIcon({ x: 7, y: 6, w: 26, h: 12 }, 'M14 1.5v2.5M26 1.5v2.5M14 20v2.5M26 20v2.5') },
  { value: 'inside', label: 'Dentro', preview: frameIcon({ x: 3, y: 3, w: 34, h: 18 }, 'M12 5.5v2.5M24 5.5v2.5M12 16v2.5M24 16v2.5') },
]
const MARKER_PREVIEW: Record<MarkerLook, ReactNode> = {
  auto: (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-primary" />
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <MapPin className="h-5 w-5 text-primary" />
    </span>
  ),
  icon: <MapPin className="h-5 w-5 text-primary" />,
  dot: <span className="h-3.5 w-3.5 rounded-full bg-primary" />,
}
// o desenho de cada modelo: onde ficam os mapas na folha
const modelIcon = (rects: [number, number, number, number][]) => (
  <svg viewBox="0 0 40 24" className="h-6 w-10" fill="none" stroke="currentColor" strokeWidth="1.4">
    {rects.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="0.8" />)}
  </svg>
)
const MODEL_TILES: { value: SheetModel; label: string; preview: ReactNode }[] = [
  { value: 'single', label: SHEET_MODEL_LABELS.single, preview: modelIcon([[4, 3, 32, 18]]) },
  { value: 'side', label: SHEET_MODEL_LABELS.side, preview: modelIcon([[3, 3, 16, 18], [21, 3, 16, 18]]) },
  { value: 'details', label: SHEET_MODEL_LABELS.details, preview: modelIcon([[3, 3, 24, 18], [29, 3, 8, 5], [29, 9.5, 8, 5], [29, 16, 8, 5]]) },
]
const placeIcon = (parts: { frame: [number, number, number, number]; box: [number, number, number, number] }) => (
  <svg viewBox="0 0 40 24" className="h-6 w-10" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x={parts.frame[0]} y={parts.frame[1]} width={parts.frame[2]} height={parts.frame[3]} rx="0.8" />
    <rect x={parts.box[0]} y={parts.box[1]} width={parts.box[2]} height={parts.box[3]} rx="0.8" fill="currentColor" fillOpacity="0.35" />
  </svg>
)
const PLACE_PREVIEW: Record<LegendPlace, ReactNode> = {
  over: placeIcon({ frame: [4, 3, 32, 18], box: [24, 12, 10, 7] }),
  side: placeIcon({ frame: [4, 3, 22, 18], box: [28, 3, 8, 18] }),
  below: placeIcon({ frame: [4, 3, 32, 12], box: [4, 17, 32, 4] }),
}
const PLACE_CAPTION: Record<LegendPlace, string> = {
  over: 'Sobre o mapa principal, no canto que você escolher.',
  side: 'Numa coluna ao lado dos mapas; sobra espaço embaixo para um texto.',
  below: 'Numa faixa embaixo dos mapas, na largura toda, sem cobrir nenhum.',
}
const ALIGN_OPTIONS = TITLE_ALIGNS.map((value) => ({ value, label: TITLE_ALIGN_LABELS[value] }))
const NORTH_OPTIONS = NORTH_STYLES.map((value) => ({ value, label: NORTH_LABELS[value] }))
const PROPERTY_MODES = [{ value: 'all', label: 'Todas' }, { value: 'some', label: 'Só algumas' }] as const
const PROPERTY_SOURCE = 'propriedades'
const todayLabel = () => new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

const countRows = (items: LegendItem[]): number => items.reduce((n, i) => n + 1 + countRows(i.children), 0)

const PAPER_OPTIONS = PAPERS.map((value) => ({ value, label: PAPER_LABELS[value] }))
const ORIENTATION_OPTIONS = ORIENTATIONS.map((value) => ({ value, label: ORIENTATION_LABELS[value] }))

async function loadBaseStyle(key: BasemapKey): Promise<Json> {
  if (key === 'mineral') return tintMineral(await loadMineralStyle(), readMapTokens())
  const style = STATIC_STYLES[key]
  if (typeof style !== 'string') return style as Json
  const res = await fetch(style)
  if (!res.ok) throw new Error(`base: ${res.status}`)
  return res.json()
}

const calmMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type ExportState =
  | { status: 'idle' }
  | { status: 'working'; kind: ExportKind }
  | { status: 'done'; kind: ExportKind; name: string }
  | { status: 'error' }

const KIND_LABEL: Record<ExportKind, string> = { pdf: 'PDF', png: 'PNG' }

export function GerarMapa({ session, onClose }: { session: GerarMapaSession; onClose: () => void }) {
  const { region } = useRegion()
  const regionName = region?.nome ?? null

  // ── abre e fecha com movimento: o fechar é mais rápido que o abrir (8.1) ──
  const [shown, setShown] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() => { setShown(true); root.current?.focus() })
    return () => { cancelAnimationFrame(frame); before?.focus?.() }
  }, [])
  const close = useCallback(() => {
    setShown(false)
    window.setTimeout(onClose, calmMotion() ? 0 : 150)
  }, [onClose])
  useEffect(() => {
    // um menu ou campo aberto por dentro já tratou este Esc (preventDefault): fecha só ele
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  // ── escolhas da pessoa ──
  // o que a pessoa deixou da última vez (neste aparelho); título e textos da legenda não voltam: partem do automático
  const saved = useMemo(() => readGerarPrefs(), [])
  // O que o sistema propõe olhando o mapa que a pessoa via. Só vale enquanto ela não escolheu: o que ela mexe (ou já deixou lembrado) fica
  // fixo e nunca é reajustado, e a proposta nunca é gravada como se fosse escolha dela.
  const legendBase = useMemo(() => buildLegend(session.legend.options, session.legend.activeLayers, session.legend.ruleLegends), [session.legend])
  const legendRowsBase = useMemo(() => legendBase.reduce((n, sec) => n + countRows(sec.items), 0), [legendBase])
  const [auto] = useState(() => autoSheet({ viewport: session.viewport, zoom: session.camera.zoom }))
  const [chosen, setChosen] = useState({ orientation: saved.orientation !== undefined, inset: saved.show?.inset !== undefined })
  const [paper, setPaper] = useState<Paper>(saved.paper ?? DEFAULT_SHEET.paper)
  // o modelo da folha: um mapa, dois lado a lado, ou um grande com detalhes de perto; e o painel que a pessoa está movendo
  const [model, setModelRaw] = useState<SheetModel>(saved.model ?? DEFAULT_SHEET_MODEL)
  const [detailCount, setDetailCount] = useState<number>(saved.details ?? DEFAULT_DETAIL_COUNT)
  const [selectedPanel, setSelectedPanel] = useState('main')
  const setModel = (m: SheetModel) => { setModelRaw(m); setSelectedPanel('main') }
  const [orientation, setOrientationRaw] = useState<Orientation>(saved.orientation ?? auto.orientation)
  const setOrientation = (v: Orientation) => { setOrientationRaw(v); setChosen((c) => ({ ...c, orientation: true })) }
  // a base parte do que o mapa mostra; só vira lembrada se a pessoa escolher uma aqui
  const [basemap, setBasemap] = useState<BasemapKey>(() => saved.basemap ?? printBasemapFor(session.basemap))
  const automatic = useMemo(() => autoTitle(regionName, session.layerNames), [regionName, session.layerNames])
  // o que a pessoa escreveu e arrumou na folha também volta (por região); só o logo não
  const content = useMemo(() => readGerarContent(session.regiaoId), [session.regiaoId])
  const [typed, setTyped] = useState<string | null>(content.title ?? null) // null: segue o título automático
  const title = typed ?? automatic

  const [show, setShow] = useState<Record<Part, boolean>>({ ...DEFAULT_SHOW, inset: auto.inset, ...saved.show })
  const [coords, setCoords] = useState<GridFormat>(saved.coords ?? 'dms')
  // texto livre: blocos soltos na folha, escritos e arrastados nela mesma; o jeito do último que a pessoa mexeu vale para o próximo
  const [blocks, setBlocks] = useState<MapBlock[]>(content.blocks ?? [])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [focusBlock, setFocusBlock] = useState<string | null>(null)
  const [look, setLook] = useState<BlockLook>(content.look ?? DEFAULT_LOOK)
  const addBlock = () => {
    if (blocks.length >= MAX_BLOCKS) return
    const b = newBlock(blocks, look)
    setBlocks((all) => [...all, b])
    setSelectedBlock(b.id)
    setFocusBlock(b.id)
  }
  const editBlock = useCallback((id: string, text: string) => setBlocks((all) => all.map((b) => (b.id === id ? { ...b, text } : b))), [])
  const moveBlock = useCallback((id: string, x: number, y: number) => setBlocks((all) => all.map((b) => (b.id === id ? { ...b, x, y } : b))), [])
  const lookBlock = (patch: Partial<BlockLook>) => {
    setLook((l) => ({ ...l, ...patch }))
    setBlocks((all) => all.map((b) => (b.id === selectedBlock ? { ...b, ...patch } : b)))
  }
  const removeBlock = () => { setBlocks((all) => all.filter((b) => b.id !== selectedBlock)); setSelectedBlock(null) }
  const chosenBlock = blocks.find((b) => b.id === selectedBlock) ?? null
  const [gridLevel, setGridLevel] = useState(saved.gridLevel ?? DEFAULT_GRID_LEVEL)
  const [gridNumbers, setGridNumbers] = useState<GridNumbers>(saved.gridNumbers ?? DEFAULT_GRID_NUMBERS)
  const [northStyle, setNorthStyle] = useState<NorthStyle>(saved.northStyle ?? DEFAULT_NORTH_STYLE)
  const [titleAlign, setTitleAlign] = useState<TitleAlign>(saved.titleAlign ?? DEFAULT_TITLE_ALIGN)
  const [markerLook, setMarkerLook] = useState<MarkerLook>(saved.markerLook ?? DEFAULT_MARKER_LOOK)
  // propriedades da folha: todas, ou só as escolhidas pelo nome (a escolha é desta região e deste mapa: não fica salva)
  const [propMode, setPropMode] = useState<'all' | 'some'>(content.propMode ?? 'all')
  const [pickedProps, setPickedProps] = useState<PickedProperty[]>(content.props ?? [])
  const hasIcons = session.iconLayers.length > 0
  const hasProps = useMemo(
    () => session.dataSourceIds.includes(PROPERTY_SOURCE) && (session.snapshot?.layers ?? []).some((l: any) => l.source === PROPERTY_SOURCE),
    [session.dataSourceIds, session.snapshot],
  )
  const only = useMemo(
    () => (hasProps && propMode === 'some' ? { source: PROPERTY_SOURCE, ids: pickedProps.map((p) => p.id) } : null),
    [hasProps, propMode, pickedProps],
  )
  // o logo não é salvo: vale enquanto esta tela está aberta
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [legendCorner, setLegendCorner] = useState<Corner>(saved.legendCorner ?? DEFAULT_LEGEND_CORNER)
  // onde a legenda fica: o que a pessoa escolheu (ou deixou lembrado) ou, enquanto não escolheu, o que combina com o modelo
  const [placeChoice, setPlaceChoice] = useState<LegendPlace | null>(saved.legendPlace ?? (saved.legendSide === undefined ? null : saved.legendSide ? 'side' : 'over'))
  const autoPlace = autoLegendPlace(model, orientation, legendRowsBase)
  const wantedPlace = placeChoice ?? autoPlace
  // ao lado só cabe na folha deitada; em pé, a escolha fica guardada e volta quando a folha voltar a ser deitada
  const legendPlace: LegendPlace = wantedPlace === 'side' && orientation !== 'landscape' ? (model === 'single' ? 'over' : 'below') : wantedPlace
  const [legendOpacity, setLegendOpacity] = useState<LegendOpacity>(saved.legendOpacity ?? DEFAULT_SHEET_LEGEND_OPACITY)
  // os itens tirados da legenda voltam tirados; o resto das edições (nomes, ordem) parte do automático de cada dia
  const [legendEdits, setLegendEdits] = useState<LegendEdits>(() => ({ ...EMPTY_LEGEND_EDITS, hidden: saved.legendHidden ?? [], ...(content.legend ?? {}) }))
  useEffect(() => {
    saveGerarContent(session.regiaoId, {
      title: typed !== null && typed !== automatic ? typed : undefined,
      blocks,
      look,
      legend: { title: legendEdits.title, labels: legendEdits.labels, order: legendEdits.order },
      propMode,
      props: pickedProps,
    })
  }, [session.regiaoId, typed, automatic, blocks, look, legendEdits.title, legendEdits.labels, legendEdits.order, propMode, pickedProps])
  const legendSections = useMemo(() => applyLegendEdits(legendBase, legendEdits), [legendBase, legendEdits])
  const corners = useMemo(() => placeCorners(legendPlace === 'over' ? legendCorner : null), [legendPlace, legendCorner])
  useEffect(() => {
    saveGerarPrefs({ paper, model, details: detailCount, orientation: chosen.orientation ? orientation : undefined, coords, legendCorner, legendPlace: placeChoice ?? undefined, gridLevel, gridNumbers, northStyle, titleAlign, legendOpacity, markerLook, legendHidden: legendEdits.hidden, show: chosen.inset ? show : { ...show, inset: undefined } })
  }, [paper, model, detailCount, orientation, coords, legendCorner, placeChoice, gridLevel, gridNumbers, northStyle, titleAlign, legendOpacity, markerLook, legendEdits.hidden, show, chosen])
  // a frase "Ajustamos a folha" só aparece enquanto alguma proposta diferente do padrão ainda vale
  const autoNote = (!chosen.orientation && auto.orientation !== DEFAULT_SHEET.orientation) || (placeChoice === null && autoPlace !== 'over') || (!chosen.inset && auto.inset)

  // ── o índice: a seção à vista fica marcada; tocar num rótulo (ou num elemento da folha) rola até ela e a destaca uma vez ──
  const scroller = useRef<HTMLDivElement>(null)
  const sections = useRef<Partial<Record<SectionId, HTMLElement | null>>>({})
  const [current, setCurrent] = useState<SectionId>('folha')
  const [flash, setFlash] = useState<SectionId | null>(null)
  // aviso neutro no alto (12): diz por que uma opção não está disponível, no lugar de só esmaecê-la
  const [notice, setNotice] = useState<NoticeData | null>(null)
  const flashTimer = useRef<number>(0)
  useEffect(() => () => window.clearTimeout(flashTimer.current), [])
  const topOf = (id: SectionId) => {
    const box = scroller.current
    const el = sections.current[id]
    return box && el ? el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop : 0
  }
  const readSection = useCallback(() => {
    const box = scroller.current
    if (!box) return
    const tops = Object.fromEntries(SECTION_IDS.map((id) => [id, topOf(id)])) as Record<SectionId, number>
    setCurrent(activeSection(tops, box.scrollTop, box.scrollTop + box.clientHeight >= box.scrollHeight - 2))
  }, [])
  const goTo = (id: SectionId) => {
    const box = scroller.current
    if (!box) return
    setCurrent(id)
    box.scrollTo({ top: Math.max(0, topOf(id) - 8), behavior: calmMotion() ? 'auto' : 'smooth' })
    setFlash(id)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600)
  }
  const onTarget = (t: SheetTarget) => goTo(SHEET_TARGETS[t].section)
  // cada seção: o nome (o mesmo do índice) e os cartões do assunto
  const section = (id: SectionId, children: ReactNode) => (
    <section
      key={id}
      ref={(el) => { sections.current[id] = el }}
      aria-labelledby={`gerar-${id}`}
      className={cn('rounded-xl border p-3 ring-2 transition-[background-color,border-color,box-shadow] duration-500', flash === id ? 'border-primary bg-secondary ring-primary/50' : 'border-border bg-muted ring-transparent')}
    >
      <h3 id={`gerar-${id}`} className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
        <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
        {SECTION_LABELS[id]}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  )

  // onde o mapa está quando assenta: o fuso do rodapé vem daqui (durante o arrasto o texto não muda)
  const [center, setCenter] = useState({ lng: session.camera.lng, lat: session.camera.lat })
  const onSettle = useCallback((c: Camera) => setCenter({ lng: c.lng, lat: c.lat }), [])
  const today = useMemo(todayLabel, [])

  // ── a base da folha: a escolhida + as camadas de dados do mapa. Ao trocar, a anterior fica na tela até a nova chegar (nada pisca) ──
  const [baseStyle, setBaseStyle] = useState<Json | null>(null)
  const [baseState, setBaseState] = useState<{ status: 'loading' | 'ready' | 'error'; shown: BasemapKey }>({ status: 'loading', shown: basemap })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let alive = true
    setBaseState((s) => ({ ...s, status: 'loading' }))
    loadBaseStyle(basemap)
      .then((style) => { if (alive) { setBaseStyle(style); setBaseState({ status: 'ready', shown: basemap }) } })
      .catch(async () => {
        if (!alive) return
        // o Mineral é o único que baixa de fora e pode faltar: a folha cai para Ruas e diz isso em frase
        if (basemap === 'mineral') {
          try {
            const streets = await loadBaseStyle('streets')
            if (alive) { setBaseStyle(streets); setBaseState({ status: 'ready', shown: 'streets' }) }
            return
          } catch { /* sem internet: cai no erro abaixo */ }
        }
        if (alive) setBaseState((s) => ({ ...s, status: 'error' }))
      })
    return () => { alive = false }
  }, [basemap, retry])

  const sheetStyle = useMemo(() => {
    if (!baseStyle) return null
    const hillshade = HILLSHADE_BASEMAPS.has(baseState.shown)
      ? { source: { type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: DEM_MAX_ZOOM }, paint: hillshadePaint(readMapTokens()) }
      : null
    return composeSheetStyle(baseStyle, session.snapshot, session.dataSourceIds, hillshade, only)
  }, [baseStyle, baseState.shown, session.snapshot, session.dataSourceIds, only])

  const credits = useMemo(() => {
    const parts = collectAttributions(sheetStyle as any).flatMap((html) => parseAttribution(html).map((p) => p.text.trim()))
    return parts.filter(Boolean).join(' · ')
  }, [sheetStyle])

  const settings = useMemo<SheetSettings>(
    () => ({ paper, orientation, model, detailCount, title, show, coords, gridLevel, gridNumbers, northStyle, titleAlign, legendOpacity, markerLook, legendPlace, blocks, corners, legend: { title: legendEdits.title, sections: legendSections }, credits, today, logoUrl, center }),
    [paper, orientation, model, detailCount, title, show, coords, gridLevel, gridNumbers, northStyle, titleAlign, legendOpacity, markerLook, legendPlace, blocks, corners, legendEdits.title, legendSections, credits, today, logoUrl, center],
  )

  // ── a folha cabe na área disponível; o mapa dentro dela acompanha ──
  const stage = useRef<HTMLDivElement>(null)
  const [room, setRoom] = useState<Size>({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setRoom({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // a mesma folha que a SheetPage desenha: o que o conteúdo pede (texto abaixo do título, legenda ao lado, números na margem) já entra
  const sheet = useMemo(() => layoutOf(settings), [settings])
  const PAD = 24
  const px = Math.max(0, Math.min((room.w - PAD * 2) / sheet.width, (room.h - PAD * 2) / sheet.height)) // pixels por milímetro
  const frameW = Math.round(sheet.map.w * px)

  // ── baixar: a folha é desenhada fora da tela, no tamanho do papel e a 300 dpi, e fotografada ──
  const cameraProbes = useRef<Record<string, () => Camera | null>>({})
  const [job, setJob] = useState<ExportJob | null>(null)
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })
  const working = exportState.status === 'working'
  const ready = !!sheetStyle && baseState.status === 'ready'

  const download = (kind: ExportKind) => {
    if (!sheetStyle || frameW <= 0) { setExportState({ status: 'error' }); return }
    // o mapa da folha de exportação é maior que o da tela: o zoom sobe junto, para mostrar exatamente a mesma área. Cada mapa da folha
    // (um, dois ou o grande com os detalhes) leva a sua câmera.
    const target = exportSize(sheet.width, sheet.height)
    const cameras: Record<string, Camera> = {}
    for (const panel of sheet.panels) {
      const cam = cameraProbes.current[panel.id]?.()
      const screenW = Math.round(panel.rect.w * px)
      if (!cam || screenW <= 0) { setExportState({ status: 'error' }); return }
      cameras[panel.id] = { lng: cam.lng, lat: cam.lat, zoom: cam.zoom + Math.log2(Math.round(panel.rect.w * target.pxPerMm) / screenW) }
    }
    setExportState({ status: 'working', kind })
    setJob({
      kind,
      cameras,
      page: { settings, session, style: sheetStyle, baseStyle, basemap: baseState.shown },
    })
  }
  const onDone = (blob: Blob) => {
    const kind = job?.kind ?? 'pdf'
    const name = exportFileName(title, new Date(), kind)
    saveBlob(blob, name)
    setJob(null)
    setExportState({ status: 'done', kind, name })
  }
  const onFail = () => { setJob(null); setExportState({ status: 'error' }) }

  const unavailable = basemap !== baseState.shown

  const footerLine =
    exportState.status === 'working' ? `Gerando o ${KIND_LABEL[exportState.kind]}. Pode levar alguns segundos.`
    : exportState.status === 'done' ? `Pronto: ${KIND_LABEL[exportState.kind]} baixado. Procure ${exportState.name} na pasta de downloads.`
    : exportState.status === 'error' ? 'Não conseguimos gerar o mapa. Veja se a internet está funcionando e tente de novo.'
    : !ready ? 'Espere o mapa de fundo carregar para baixar.'
    : `Sai em ${PAPER_LABELS[paper]}, ${ORIENTATION_LABELS[orientation].toLowerCase()}, pronto para imprimir.`

  return (
    <div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-label="Gerar mapa"
      className={cn(
        'fixed inset-0 z-[2500] flex origin-bottom flex-col bg-muted/50 outline-hidden transition-[opacity,scale]',
        shown ? 'scale-100 opacity-100 duration-[240ms] ease-spring' : 'scale-[0.98] opacity-0 duration-150 ease-in',
      )}
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
        <h2 className="whitespace-nowrap text-base font-semibold">Gerar mapa</h2>
        <button type="button" onClick={close} className={cn('flex h-10 items-center gap-2 px-3 text-sm font-medium', controlItem())}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao mapa
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* A folha: o que se vê aqui é o que vai para o papel */}
        <div ref={stage} className="relative min-h-0 flex-1 overflow-clip">
          {px > 0 && sheetStyle && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <SheetPage
                settings={settings}
                session={session}
                style={sheetStyle}
                baseStyle={baseStyle}
                basemap={baseState.shown}
                px={px}
                cameraProbes={cameraProbes}
                selectedPanel={selectedPanel}
                onPanelSelect={setSelectedPanel}
                selectedBlock={selectedBlock}
                focusBlock={focusBlock}
                onBlockSelect={setSelectedBlock}
                onBlockMove={moveBlock}
                onBlockEdit={editBlock}
                onTarget={onTarget}
                onSettle={onSettle}
              />
            </div>
          )}
        </div>

        {/* Os ajustes: as seções na ordem em que a folha se lê, um cartão por assunto (6.2); o índice leva a cada uma; embaixo, a ação de baixar (19.2) */}
        <aside aria-label="Ajustes do mapa" className="flex max-h-[55svh] min-h-0 shrink-0 flex-col border-t border-border bg-muted/50 md:max-h-none md:w-[24rem] md:border-l md:border-t-0">
          <nav aria-label="Seções dos ajustes" className="shrink-0 border-b border-border bg-card px-2 py-1.5">
            <div className="grid grid-cols-5 gap-1">
              {SECTION_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-current={current === id ? 'true' : undefined}
                  onClick={() => goTo(id)}
                  className={cn('h-10 px-1 text-[13px] font-medium', controlItem(current === id))}
                >
                  {SECTION_LABELS[id]}
                </button>
              ))}
            </div>
          </nav>
          <OverlayScroll ref={scroller} onScroll={readSection} data-panel-scroll className="min-h-0 flex-1 p-4">
            <div className="space-y-4 pb-6">
              <div>
                <Collapse open={autoNote} clip>
                  <div className="pb-4">
                    <p role="status" className="rounded-lg border border-primary/30 bg-secondary p-3 text-sm text-secondary-foreground">Ajustamos a folha ao seu mapa. Mude o que quiser: o que você escolhe fica.</p>
                  </div>
                </Collapse>
              </div>
              {section('folha', <>
              <PanelCard title="Modelo" caption={model === 'single' ? 'Escolha como os mapas se distribuem na folha.' : 'Toque num mapa da folha para escolher qual mover. Cada um tem o seu zoom.'}>
                <ChoiceTiles label="Modelo da folha" value={model} options={MODEL_TILES} onChange={setModel} />
                <Collapse open={model === 'details'} clip>
                  <div className="pt-4">
                    <p className="mb-2 text-sm text-muted-foreground">Quantos detalhes</p>
                    <Segmented label="Quantos detalhes" value={String(detailCount) as '1' | '2' | '3' | '4'} options={DETAIL_COUNTS.map((n) => ({ value: String(n) as '1' | '2' | '3' | '4', label: String(n) }))} onChange={(v) => setDetailCount(Number(v))} />
                  </div>
                </Collapse>
              </PanelCard>
              <PanelCard title="Folha" caption="Arraste o mapa dentro da folha e use a roda do mouse para o zoom.">
                <div className="space-y-6">
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Papel</p>
                    <Segmented label="Papel" value={paper} options={PAPER_OPTIONS} onChange={setPaper} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">Posição</p>
                    <Segmented label="Posição da folha" value={orientation} options={ORIENTATION_OPTIONS} onChange={setOrientation} />
                  </div>
                </div>
              </PanelCard>
              </>)}
              {section('cabecalho', <>
              <PanelCard title="Cabeçalho" caption="Aparece na faixa do alto da folha.">
                <p className="mb-2 text-sm text-muted-foreground">Título</p>
                <Input aria-label="Título do mapa" value={title} onChange={(e) => setTyped(e.target.value)} />
                {typed !== null && typed !== automatic && (
                  <button type="button" onClick={() => setTyped(null)} className={cn('mt-3 flex h-10 items-center gap-2 px-2 text-sm font-medium', controlItem())}>
                    <Undo2 className="h-4 w-4" aria-hidden />
                    Voltar ao título automático
                  </button>
                )}
                <div className="mt-6">
                  <p className="mb-2 text-sm text-muted-foreground">Alinhamento</p>
                  <Segmented label="Alinhamento do título" value={titleAlign} options={ALIGN_OPTIONS} onChange={setTitleAlign} />
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Logo</p>
                  <p className="mb-3 mt-0.5 text-xs leading-snug text-muted-foreground">Aparece à esquerda do título. Não fica salvo: ao fechar esta tela, ele sai.</p>
                  <LogoPicker value={logoUrl} onChange={setLogoUrl} />
                </div>
              </PanelCard>
              </>)}
              {section('textos', <NoteCard blocks={blocks} selected={chosenBlock} onAdd={addBlock} onLook={lookBlock} onRemove={removeBlock} />)}
              {section('mapa', <>
              <PanelCard title="Mapa de fundo">
                <div className="space-y-5">
                  {PRINT_BASEMAP_GROUPS.map((g) => (
                    <div key={g.title}>
                      <p className="mb-2 text-sm text-muted-foreground">{g.title}</p>
                      <ChoiceTiles
                        label={g.title}
                        value={g.keys.includes(basemap) ? basemap : null}
                        columns={2}
                        options={g.keys.map((key) => ({ value: key, label: BASEMAP_LABELS[key], preview: <span className="h-full w-full" style={{ background: BASEMAP_SWATCH[key] }} /> }))}
                        // clicar no Mineral de novo, depois de falhar, tenta outra vez: por isso o já escolhido não fica bloqueado
                        onChange={(key) => { setBasemap(key); saveGerarPrefs({ basemap: key }); if (key === basemap) setRetry((n) => n + 1) }}
                      />
                    </div>
                  ))}
                </div>
                <div aria-live="polite">
                  {baseState.status === 'loading' && <p className="mt-3 text-xs text-muted-foreground">Carregando o mapa de fundo…</p>}
                  {baseState.status === 'ready' && unavailable && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {BASEMAP_LABELS[basemap]} indisponível agora. Mostrando {BASEMAP_LABELS[baseState.shown]}.
                    </p>
                  )}
                  {baseState.status === 'error' && (
                    <div className="mt-3 rounded-md border border-crit/40 p-3">
                      <p className="text-sm">Não conseguimos carregar o mapa de fundo. Veja se a internet está funcionando.</p>
                      <button type="button" onClick={() => setRetry((n) => n + 1)} className={cn('mt-2 flex h-10 items-center px-3 text-sm font-medium', controlItem())}>
                        Tentar de novo
                      </button>
                    </div>
                  )}
                </div>
              </PanelCard>
              {hasIcons && (
                <PanelCard title="Ações" caption="Como cada ação aparece na folha. O mapa não muda.">
                  <ChoiceTiles
                    label="Como as ações aparecem"
                    value={markerLook}
                    options={MARKER_LOOKS.map((value) => ({ value, label: MARKER_LOOK_LABELS[value], preview: MARKER_PREVIEW[value] }))}
                    onChange={setMarkerLook}
                  />
                  <p key={markerLook} className="animate-in fade-in mt-3 text-xs leading-snug text-muted-foreground duration-200">
                    {markerLook === 'auto' ? 'Longe, um ponto; perto, o ícone.' : markerLook === 'icon' ? 'O ícone aparece em qualquer distância, até com o mapa longe.' : 'Só o ponto colorido, mesmo com o mapa perto.'}
                  </p>
                </PanelCard>
              )}
              {hasProps && (
                <PanelCard title="Propriedades" caption="Quais propriedades aparecem na folha. O mapa não muda.">
                  <Segmented label="Quais propriedades aparecem" value={propMode} options={[...PROPERTY_MODES]} onChange={setPropMode} />
                  <Collapse open={propMode === 'some'} clip>
                    <div className="pt-4">
                      <PropertyPicker regiaoId={session.regiaoId} chosen={pickedProps} onChange={setPickedProps} />
                      {pickedProps.length === 0 && (
                        <p role="status" className="animate-in fade-in mt-3 text-xs leading-snug text-muted-foreground duration-200">Nenhuma escolhida ainda: a folha sai sem propriedades. Procure pelo nome e ligue as que quer.</p>
                      )}
                    </div>
                  </Collapse>
                </PanelCard>
              )}
              <PanelCard title="O que aparece" caption="Ao ligar um item, os ajustes dele aparecem logo abaixo. Título, legenda e fonte dos dados sempre saem.">
                <ul className="-my-1">
                  {PARTS.map(({ id, label }) => (
                    // a linha toda liga e desliga (19.1): o interruptor é sempre a última coluna
                    <li key={id}>
                      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-1 py-2 text-sm transition-colors duration-200 hover:bg-muted">
                        <span>{label}</span>
                        <Switch checked={show[id]} onCheckedChange={(on) => { setShow((s) => ({ ...s, [id]: on })); if (id === 'inset') setChosen((c) => ({ ...c, inset: true })) }} aria-label={label} />
                      </label>
                      {id === 'north' && (
                        <Collapse open={show.north} clip>
                          <div className="mb-2 ml-2 border-l-2 border-border py-1 pl-3">
                            <Segmented label="Estilo da seta do norte" value={northStyle} options={NORTH_OPTIONS} onChange={setNorthStyle} />
                          </div>
                        </Collapse>
                      )}
                      {id === 'grid' && (
                        <Collapse open={show.grid} clip>
                          <div className="mb-2 ml-2 space-y-5 border-l-2 border-border py-1 pl-3">
                            <div>
                              <p className="mb-2 text-sm text-muted-foreground">Formato</p>
                              <ChoiceTiles label="Formato das coordenadas" value={coords} options={COORD_TILES} onChange={setCoords} />
                            </div>
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm text-muted-foreground">Linha da grade</p>
                                <p key={gridLevel} className="animate-in fade-in text-sm font-medium duration-200">{GRID_LEVEL_LABELS[gridLevel]}</p>
                              </div>
                              <div className="flex min-h-12 items-center">
                                <Slider
                                  aria-label="Força da linha da grade"
                                  min={0}
                                  max={GRID_LEVEL_LABELS.length - 1}
                                  step={1}
                                  value={[gridLevel]}
                                  onValueChange={([v]) => setGridLevel(v)}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-sm text-muted-foreground">Números</p>
                              <ChoiceTiles label="Onde ficam os números" value={gridNumbers} options={NUMBER_TILES} onChange={setGridNumbers} />
                            </div>
                          </div>
                        </Collapse>
                      )}
                    </li>
                  ))}
                </ul>
              </PanelCard>
              </>)}
              {section('legenda', <>
              <PanelCard title="Legenda" caption="Toque no nome para renomear, arraste a alça para mudar a ordem. Isto vale só para a folha: o mapa não muda.">
                <LegendEditor sections={legendBase} edits={legendEdits} onChange={setLegendEdits} />
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">Onde fica</p>
                  <p key={legendPlace} className="animate-in fade-in mb-2 mt-0.5 text-xs leading-snug text-muted-foreground duration-200">{PLACE_CAPTION[legendPlace]}</p>
                <ChoiceTiles
                  label="Lugar da legenda"
                  value={legendPlace}
                  options={LEGEND_PLACES.map((value) => ({
                    value,
                    label: LEGEND_PLACE_LABELS[value],
                    preview: PLACE_PREVIEW[value],
                    blocked: value === 'side' && orientation !== 'landscape' ? 'A coluna ao lado ocuparia a largura da folha em pé. Mude a posição da folha para Deitada se quiser a legenda ao lado.' : undefined,
                  }))}
                  onChange={setPlaceChoice}
                  onBlocked={(reason) => setNotice({ id: Date.now(), tone: 'info', title: 'A legenda não pode ficar ao lado agora', body: reason })}
                />
                <Collapse open={legendPlace === 'over'} clip>
                  <div className="pt-4">
                    <p className="mb-2 text-sm text-muted-foreground">Fundo</p>
                    <LegendOpacityPicker value={legendOpacity} onChange={setLegendOpacity} />
                  </div>
                  <p className="mb-2 mt-4 text-sm text-muted-foreground">Canto</p>
                  <div role="radiogroup" aria-label="Canto da legenda" className="grid grid-cols-2 gap-2">
                    {CORNERS.map((c) => {
                      const selected = c === legendCorner
                      return (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setLegendCorner(c)}
                          className={cn(
                            'flex min-h-12 items-center justify-center rounded-md border px-2 text-center text-sm transition-[background-color,border-color,color,translate,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
                            selected ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          {CORNER_LABELS[c]}
                        </button>
                      )
                    })}
                  </div>
                </Collapse>
                </div>
              </PanelCard>
              </>)}
            </div>
          </OverlayScroll>
<footer className="shrink-0 border-t border-border bg-card p-4 shadow-control">
            <p
              role="status"
              aria-live="polite"
              className={cn('mb-3 text-sm leading-snug', exportState.status === 'error' ? 'text-crit' : 'text-muted-foreground')}
            >
              {footerLine}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" aria-disabled={!ready || working} onClick={() => { if (ready && !working) download('pdf') }}>
                <FileDown className="h-4 w-4" aria-hidden />
                {working && exportState.kind === 'pdf' ? 'Gerando…' : 'Baixar PDF'}
              </Button>
              <Button type="button" variant="secondary" aria-disabled={!ready || working} onClick={() => { if (ready && !working) download('png') }}>
                <FileDown className="h-4 w-4" aria-hidden />
                {working && exportState.kind === 'png' ? 'Gerando…' : 'Baixar PNG'}
              </Button>
            </div>
          </footer>
        </aside>
      </div>

      {/* acima da tela (z 2500): o aviso do mapa principal fica atrás dela */}
      <div className="pointer-events-none fixed inset-x-3 top-4 z-[2600] flex justify-center">
        <Notice notice={notice} onClose={() => setNotice(null)} />
      </div>

      {job && <SheetExport job={job} onDone={onDone} onError={onFail} />}
    </div>
  )
}
