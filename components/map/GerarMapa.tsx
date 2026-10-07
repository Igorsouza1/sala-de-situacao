'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, FileDown, Undo2 } from 'lucide-react'
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
import { Segmented } from './Segmented'
import { SheetExport, type ExportJob } from './SheetExport'
import { SheetPage, layoutOf, type Camera, type Json, type SheetSettings, type Size } from './SheetPage'
import { controlItem } from './helpers/control-style'
import { collectAttributions, parseAttribution } from './helpers/attribution'
import {
  BASEMAP_LABELS,
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
  DEFAULT_SHOW,
  EMPTY_NOTES,
  GRID_LEVEL_LABELS,
  NORTH_LABELS,
  NORTH_STYLES,
  PRINT_BASEMAPS,
  autoTitle,
  composeSheetStyle,
  printBasemapFor,
  type GridNumbers,
  type NorthStyle,
  MAX_BLOCKS,
  newBlock,
  type MapBlock,
  type Part,
} from './helpers/gerar-mapa'
import { clearGerarPrefs, isCustomGerar, readGerarPrefs, saveGerarPrefs } from './helpers/map-prefs'
import type { GridFormat } from './helpers/grid'
import { EMPTY_LEGEND_EDITS, applyLegendEdits, buildLegend, type LegendEdits } from './helpers/legend-sheet'
import type { RuleLegendSection } from './helpers/legend-rules'
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
}

const SWATCH: Record<BasemapKey, string> = {
  mineral: 'linear-gradient(135deg, var(--color-map-grass) 0 55%, var(--color-map-water) 55%)',
  'satellite-soft': 'linear-gradient(135deg, color-mix(in oklab, var(--color-muted-foreground) 45%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-muted-foreground) 55%, var(--color-water)) 55%)',
  satellite: 'linear-gradient(135deg, color-mix(in oklab, var(--color-foreground) 60%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-foreground) 55%, var(--color-water)) 55%)',
  streets: 'linear-gradient(135deg, var(--color-background) 0 55%, var(--color-border) 55%)',
  osm: 'linear-gradient(135deg, var(--color-map-urban) 0 55%, var(--color-map-grass) 55%)',
}

const PARTS: { id: Part; label: string }[] = [
  { id: 'north', label: 'Seta do norte' },
  { id: 'scale', label: 'Escala' },
  { id: 'grid', label: 'Grade com coordenadas' },
  { id: 'datum', label: 'Datum e fuso' },
  { id: 'date', label: 'Data de hoje' },
  { id: 'inset', label: 'Mapa de localização' },
]
const COORD_OPTIONS: { value: GridFormat; label: string }[] = [{ value: 'dms', label: 'Graus' }, { value: 'utm', label: 'UTM' }]
const NUMBER_OPTIONS: { value: GridNumbers; label: string }[] = [{ value: 'margin', label: 'Na margem' }, { value: 'inside', label: 'Dentro do mapa' }]
const NORTH_OPTIONS = NORTH_STYLES.map((value) => ({ value, label: NORTH_LABELS[value] }))
const LEGEND_PLACE_OPTIONS = [{ value: 'over', label: 'Sobre o mapa' }, { value: 'side', label: 'Ao lado do mapa' }] as const
const todayLabel = () => new Date().toLocaleDateString('pt-BR')

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

// No celular os ajustes viram abas: o que muda a cada vez (Texto), a Legenda e a Folha. No computador, todos os cartões ficam à vista.
type Tab = 'texto' | 'legenda' | 'folha'
const TABS: { id: Tab; label: string }[] = [
  { id: 'texto', label: 'Texto' },
  { id: 'legenda', label: 'Legenda' },
  { id: 'folha', label: 'Folha' },
]

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
  const [paper, setPaper] = useState<Paper>(saved.paper ?? DEFAULT_SHEET.paper)
  const [orientation, setOrientation] = useState<Orientation>(saved.orientation ?? DEFAULT_SHEET.orientation)
  // a base parte do que o mapa mostra; só vira lembrada se a pessoa escolher uma aqui
  const [picked, setPicked] = useState<BasemapKey | null>(saved.basemap ?? null)
  const [basemap, setBasemap] = useState<BasemapKey>(() => saved.basemap ?? printBasemapFor(session.basemap))
  const automatic = useMemo(() => autoTitle(regionName, session.layerNames), [regionName, session.layerNames])
  const [typed, setTyped] = useState<string | null>(null) // null: segue o título automático
  const title = typed ?? automatic

  const [show, setShow] = useState<Record<Part, boolean>>({ ...DEFAULT_SHOW, ...saved.show })
  const [coords, setCoords] = useState<GridFormat>(saved.coords ?? 'dms')
  const [notes, setNotes] = useState(EMPTY_NOTES)
  const setNote = (where: 'title' | 'side', value: string) => setNotes((n) => ({ ...n, [where]: value }))
  // textos soltos sobre o mapa: o centro de cada um é uma fração do mapa, arrastada na própria folha
  const [blocks, setBlocks] = useState<MapBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const addBlock = () => {
    const b = newBlock(blocks)
    setBlocks((all) => (all.length >= MAX_BLOCKS ? all : [...all, b]))
    setSelectedBlock(b.id)
    return b.id
  }
  const editBlock = (id: string, text: string) => setBlocks((all) => all.map((b) => (b.id === id ? { ...b, text } : b)))
  const moveBlock = (id: string, x: number, y: number) => setBlocks((all) => all.map((b) => (b.id === id ? { ...b, x, y } : b)))
  const removeBlock = (id: string) => { setBlocks((all) => all.filter((b) => b.id !== id)); setSelectedBlock((s) => (s === id ? null : s)) }
  const [gridLevel, setGridLevel] = useState(saved.gridLevel ?? DEFAULT_GRID_LEVEL)
  const [gridNumbers, setGridNumbers] = useState<GridNumbers>(saved.gridNumbers ?? DEFAULT_GRID_NUMBERS)
  const [northStyle, setNorthStyle] = useState<NorthStyle>(saved.northStyle ?? DEFAULT_NORTH_STYLE)
  // o logo não é salvo: vale enquanto esta tela está aberta
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [legendCorner, setLegendCorner] = useState<Corner>(saved.legendCorner ?? DEFAULT_LEGEND_CORNER)
  const [legendSide, setLegendSide] = useState(saved.legendSide ?? false)
  // ao lado do mapa só cabe na folha deitada; em pé, a escolha fica guardada e volta quando a folha voltar a ser deitada
  const sideActive = legendSide && orientation === 'landscape'
  // os itens tirados da legenda voltam tirados; o resto das edições (nomes, ordem) parte do automático de cada dia
  const [legendEdits, setLegendEdits] = useState<LegendEdits>(() => ({ ...EMPTY_LEGEND_EDITS, hidden: saved.legendHidden ?? [] }))
  const legendBase = useMemo(() => buildLegend(session.legend.options, session.legend.activeLayers, session.legend.ruleLegends), [session.legend])
  const legendSections = useMemo(() => applyLegendEdits(legendBase, legendEdits), [legendBase, legendEdits])
  const corners = useMemo(() => placeCorners(sideActive ? null : legendCorner), [sideActive, legendCorner])
  useEffect(() => {
    saveGerarPrefs({ paper, orientation, coords, legendCorner, legendSide, gridLevel, gridNumbers, northStyle, legendHidden: legendEdits.hidden, show })
  }, [paper, orientation, coords, legendCorner, legendSide, gridLevel, gridNumbers, northStyle, legendEdits.hidden, show])
  const custom = isCustomGerar({ paper, orientation, coords, legendCorner, legendSide, gridLevel, gridNumbers, northStyle, legendHidden: legendEdits.hidden, show, basemap: picked ?? undefined })
  const resetChoices = () => {
    clearGerarPrefs()
    setPaper(DEFAULT_SHEET.paper)
    setOrientation(DEFAULT_SHEET.orientation)
    setCoords('dms')
    setLegendCorner(DEFAULT_LEGEND_CORNER)
    setLegendSide(false)
    setGridLevel(DEFAULT_GRID_LEVEL)
    setGridNumbers(DEFAULT_GRID_NUMBERS)
    setNorthStyle(DEFAULT_NORTH_STYLE)
    setLegendEdits((e) => ({ ...e, hidden: [] }))
    setShow({ ...DEFAULT_SHOW })
    setPicked(null)
    setBasemap(printBasemapFor(session.basemap))
  }
  const [tab, setTab] = useState<Tab>('texto')
  // cada cartão diz a que aba pertence: no celular só a aba aberta aparece; no computador, todas
  const inTab = (t: Tab) => (t === tab ? 'block' : 'max-md:hidden')

  // onde o mapa está quando assenta: o fuso do rodapé vem daqui (durante o arrasto o texto não muda)
  const [center, setCenter] = useState({ lng: session.camera.lng, lat: session.camera.lat })
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
    return composeSheetStyle(baseStyle, session.snapshot, session.dataSourceIds, hillshade)
  }, [baseStyle, baseState.shown, session.snapshot, session.dataSourceIds])

  const credits = useMemo(() => {
    const parts = collectAttributions(sheetStyle as any).flatMap((html) => parseAttribution(html).map((p) => p.text.trim()))
    return parts.filter(Boolean).join(' · ')
  }, [sheetStyle])

  const settings = useMemo<SheetSettings>(
    () => ({ paper, orientation, title, show, coords, gridLevel, gridNumbers, northStyle, legendSide: sideActive, notes, blocks, corners, legend: { title: legendEdits.title, sections: legendSections }, credits, today, logoUrl, center }),
    [paper, orientation, title, show, coords, gridLevel, gridNumbers, northStyle, sideActive, notes, blocks, corners, legendEdits.title, legendSections, credits, today, logoUrl, center],
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
  const cameraProbe = useRef<(() => Camera | null) | null>(null)
  const [job, setJob] = useState<ExportJob | null>(null)
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })
  const working = exportState.status === 'working'
  const ready = !!sheetStyle && baseState.status === 'ready'

  const download = (kind: ExportKind) => {
    const cam = cameraProbe.current?.()
    if (!cam || !sheetStyle || frameW <= 0) { setExportState({ status: 'error' }); return }
    // o mapa da folha de exportação é maior que o da tela: o zoom sobe junto, para mostrar exatamente a mesma área
    const target = exportSize(sheet.width, sheet.height)
    const zoom = cam.zoom + Math.log2(Math.round(sheet.map.w * target.pxPerMm) / frameW)
    setExportState({ status: 'working', kind })
    setJob({
      kind,
      camera: { lng: cam.lng, lat: cam.lat, zoom },
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
                cameraProbe={cameraProbe}
                selectedBlock={selectedBlock}
                onBlockSelect={setSelectedBlock}
                onBlockMove={moveBlock}
                onSettle={(c) => setCenter({ lng: c.lng, lat: c.lat })}
              />
            </div>
          )}
        </div>

        {/* Os ajustes: base cinza suave, um cartão por assunto (6.2); embaixo, a ação de baixar (19.2) */}
        <aside aria-label="Ajustes do mapa" className="flex max-h-[55svh] min-h-0 shrink-0 flex-col border-t border-border bg-muted/50 md:max-h-none md:w-[24rem] md:border-l md:border-t-0">
          {/* no celular, os ajustes ficam em três abas; no computador não há abas, todos os cartões estão à vista */}
          <div role="tablist" aria-label="Ajustes" className="grid shrink-0 grid-cols-3 gap-1 border-b border-border bg-card p-1 md:hidden">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn('h-11 text-sm font-medium', controlItem(tab === id))}
              >
                {label}
              </button>
            ))}
          </div>
          <OverlayScroll data-panel-scroll className="min-h-0 flex-1 p-4">
            <div className="space-y-4 pb-6">
              <Collapse open={custom} clip>
                <div className="pb-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-secondary p-3 text-secondary-foreground">
                    <p className="text-sm">Usando suas últimas escolhas.</p>
                    <button type="button" onClick={resetChoices} className={cn('flex h-10 shrink-0 items-center gap-2 px-3 text-sm font-medium', controlItem())}>
                      <Undo2 className="h-4 w-4" aria-hidden />
                      Voltar ao padrão
                    </button>
                  </div>
                </div>
              </Collapse>
              <div className={inTab('texto')}>
              <PanelCard title="Título" caption="Aparece no alto da folha.">
                <Input aria-label="Título do mapa" value={title} onChange={(e) => setTyped(e.target.value)} />
                {typed !== null && typed !== automatic && (
                  <button type="button" onClick={() => setTyped(null)} className={cn('mt-3 flex h-10 items-center gap-2 px-2 text-sm font-medium', controlItem())}>
                    <Undo2 className="h-4 w-4" aria-hidden />
                    Voltar ao título automático
                  </button>
                )}
              </PanelCard>
              </div>
              <div className={inTab('texto')}>
              <NoteCard notes={notes} onNote={setNote} landscape={orientation === 'landscape'} blocks={blocks} selected={selectedBlock} onSelect={setSelectedBlock} onAdd={addBlock} onEdit={editBlock} onRemove={removeBlock} />
              </div>
              <div className={inTab('folha')}>
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
              </div>
              <div className={inTab('folha')}>
              <PanelCard title="O que aparece na folha" caption="Título, legenda e fonte dos dados sempre saem. Ao ligar um item, os ajustes dele aparecem logo abaixo.">
                <ul className="-my-1">
                  {PARTS.map(({ id, label }) => (
                    // a linha toda liga e desliga (19.1): o interruptor é sempre a última coluna
                    <li key={id}>
                      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-1 py-2 text-sm transition-colors duration-200 hover:bg-muted">
                        <span>{label}</span>
                        <Switch checked={show[id]} onCheckedChange={(on) => setShow((s) => ({ ...s, [id]: on }))} aria-label={label} />
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
                              <Segmented label="Formato das coordenadas" value={coords} options={COORD_OPTIONS} onChange={setCoords} />
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
                              <Segmented label="Onde ficam os números" value={gridNumbers} options={NUMBER_OPTIONS} onChange={setGridNumbers} />
                            </div>
                          </div>
                        </Collapse>
                      )}
                    </li>
                  ))}
                </ul>
              </PanelCard>
              </div>
              <div className={inTab('legenda')}>
              <PanelCard title="Legenda" caption="Toque no nome para renomear, arraste a alça para mudar a ordem. Isto vale só para a folha: o mapa não muda.">
                <LegendEditor sections={legendBase} edits={legendEdits} onChange={setLegendEdits} />
              </PanelCard>
              </div>
              <div className={inTab('legenda')}>
              <PanelCard title="Onde fica a legenda" caption={orientation === 'landscape' ? 'Ao lado, o mapa fica um pouco menor e sobra espaço para um texto.' : 'Ao lado do mapa só na folha deitada.'}>
                <Segmented
                  label="Lugar da legenda"
                  value={sideActive ? 'side' : 'over'}
                  options={[...LEGEND_PLACE_OPTIONS]}
                  onChange={(v) => setLegendSide(v === 'side')}
                  disabled={orientation !== 'landscape'}
                />
                <Collapse open={!sideActive} clip>
                  <div role="radiogroup" aria-label="Canto da legenda" className="grid grid-cols-2 gap-2 pt-4">
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
              </PanelCard>
              </div>
              <div className={inTab('folha')}>
              <PanelCard title="Logo" caption="Aparece à esquerda do título. Não fica salvo: ao fechar esta tela, ele sai.">
                <LogoPicker value={logoUrl} onChange={setLogoUrl} />
              </PanelCard>
              </div>
              <div className={inTab('folha')}>
              <PanelCard title="Mapa de fundo">
                <div role="radiogroup" aria-label="Mapa de fundo" className="grid grid-cols-3 gap-2.5">
                  {PRINT_BASEMAPS.map((key) => {
                    const selected = key === basemap
                    return (
                      // clicar no Mineral de novo, depois de falhar, tenta outra vez: por isso o já escolhido não fica bloqueado
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => { setBasemap(key); setPicked(key); saveGerarPrefs({ basemap: key }); if (key === basemap) setRetry((n) => n + 1) }}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-md border p-2 text-xs transition-[background-color,border-color,color,translate,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
                          selected ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <span className="h-9 w-full rounded-sm border border-border" style={{ background: SWATCH[key] }} aria-hidden />
                        {BASEMAP_LABELS[key]}
                      </button>
                    )
                  })}
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
              </div>
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

      {job && <SheetExport job={job} onDone={onDone} onError={onFail} />}
    </div>
  )
}
