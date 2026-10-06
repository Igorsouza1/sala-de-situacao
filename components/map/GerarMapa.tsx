'use client'

import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import { useRegion } from '@/context/RegionContext'
import type { LayerResponseDTO, MapFeatureCollection } from '@/types/map-dto'
import { MaplibreIconMarkers } from './MaplibreIconMarkers'
import { GridOverlay, NorthArrow, ScaleBlock, type MapView } from './SheetOverlays'
import { PanelCard } from './PanelCard'
import { Segmented } from './Segmented'
import { controlItem } from './helpers/control-style'
import { collectAttributions, parseAttribution } from './helpers/attribution'
import {
  BASEMAP_LABELS,
  BASEMAP_MAX_ZOOM,
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
import { PRINT_BASEMAPS, autoTitle, composeSheetStyle, printBasemapFor } from './helpers/gerar-mapa'
import { DEFAULT_SHEET, ORIENTATIONS, ORIENTATION_LABELS, PAPERS, PAPER_LABELS, sheetLayout, zoomToFit, type Orientation, type Paper } from './helpers/sheet'
import { datumLine, type GridFormat } from './helpers/grid'
import { useSmoothWheelZoom } from './helpers/use-smooth-wheel-zoom'

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
}

type Json = Record<string, any>

const SWATCH: Record<BasemapKey, string> = {
  mineral: 'linear-gradient(135deg, var(--color-map-grass) 0 55%, var(--color-map-water) 55%)',
  'satellite-soft': 'linear-gradient(135deg, color-mix(in oklab, var(--color-muted-foreground) 45%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-muted-foreground) 55%, var(--color-water)) 55%)',
  satellite: 'linear-gradient(135deg, color-mix(in oklab, var(--color-foreground) 60%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-foreground) 55%, var(--color-water)) 55%)',
  streets: 'linear-gradient(135deg, var(--color-background) 0 55%, var(--color-border) 55%)',
  osm: 'linear-gradient(135deg, var(--color-map-urban) 0 55%, var(--color-map-grass) 55%)',
}

// o que a folha pode mostrar a mais: ligado por padrão, a pessoa desliga o que não quer (título, legenda e fonte dos dados não saem)
type Part = 'north' | 'scale' | 'grid' | 'datum' | 'date' | 'logos'
const PARTS: { id: Part; label: string }[] = [
  { id: 'north', label: 'Seta do norte' },
  { id: 'scale', label: 'Escala' },
  { id: 'grid', label: 'Grade com coordenadas' },
  { id: 'datum', label: 'Datum e fuso' },
  { id: 'date', label: 'Data de hoje' },
  { id: 'logos', label: 'Brasão e logo' },
]
const COORD_OPTIONS: { value: GridFormat; label: string }[] = [{ value: 'dms', label: 'Graus' }, { value: 'utm', label: 'UTM' }]
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

interface Size { w: number; h: number }

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
  const [paper, setPaper] = useState<Paper>(DEFAULT_SHEET.paper)
  const [orientation, setOrientation] = useState<Orientation>(DEFAULT_SHEET.orientation)
  const [basemap, setBasemap] = useState<BasemapKey>(() => printBasemapFor(session.basemap))
  const automatic = useMemo(() => autoTitle(regionName, session.layerNames), [regionName, session.layerNames])
  const [typed, setTyped] = useState<string | null>(null) // null: segue o título automático
  const title = typed ?? automatic

  const [show, setShow] = useState<Record<Part, boolean>>({ north: true, scale: true, grid: true, datum: true, date: true, logos: true })
  const [coords, setCoords] = useState<GridFormat>('dms')
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

  const sheet = useMemo(() => sheetLayout(paper, orientation), [paper, orientation])
  const PAD = 24
  const px = Math.max(0, Math.min((room.w - PAD * 2) / sheet.width, (room.h - PAD * 2) / sheet.height)) // pixels por milímetro
  const frame: Size = { w: Math.round(sheet.map.w * px), h: Math.round(sheet.map.h * px) }
  const mm = (v: number) => v * px

  const unavailable = basemap !== baseState.shown

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
          {px > 0 && (
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-clip rounded-sm bg-card shadow-control transition-[width,height] duration-[320ms] ease-spring"
              style={{ width: mm(sheet.width), height: mm(sheet.height) }}
            >
              <div
                className="absolute flex items-end"
                style={{ left: mm(sheet.header.x), top: mm(sheet.header.y), width: mm(sheet.header.w), height: mm(sheet.header.h) }}
              >
                <h1 className="line-clamp-2 min-w-0 flex-1 font-semibold leading-tight text-foreground" style={{ fontSize: mm(6) }}>
                  {title}
                </h1>
                {show.logos && (
                  <div className="flex shrink-0 items-center" style={{ gap: mm(3), marginLeft: mm(4), height: mm(12) }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {region?.brasaoUrl && <img src={region.brasaoUrl} alt="Brasão" className="h-full w-auto object-contain" />}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/prisma_logo_revert.png" alt="GEO PRISMA" className="h-full w-auto object-contain" />
                  </div>
                )}
              </div>

              <div
                className="absolute overflow-clip border border-foreground bg-muted [&_.maplibregl-marker]:pointer-events-none"
                style={{ left: mm(sheet.map.x), top: mm(sheet.map.y), width: mm(sheet.map.w), height: mm(sheet.map.h) }}
              >
                {sheetStyle && frame.w > 0 && frame.h > 0 && (
                  <SheetMap
                    session={session}
                    style={sheetStyle}
                    basemap={baseState.shown}
                    frame={frame}
                    frameMm={sheet.map.w}
                    pxPerMm={px}
                    grid={show.grid ? coords : null}
                    north={show.north}
                    scale={show.scale}
                    onSettle={setCenter}
                  />
                )}
              </div>

              <div
                className="absolute flex flex-col justify-start text-muted-foreground"
                style={{ left: mm(sheet.footer.x), top: mm(sheet.footer.y), width: mm(sheet.footer.w), height: mm(sheet.footer.h), fontSize: mm(2.6), gap: mm(1) }}
              >
                <div className="flex items-start justify-between" style={{ gap: mm(4) }}>
                  <p className="shrink-0">Dados: GEO PRISMA{show.date && ` · ${today}`}</p>
                  {show.datum && <p className="min-w-0 text-right">{datumLine(coords, center.lng, center.lat)}</p>}
                </div>
                {credits && <p className="text-right">Mapa de fundo: {credits}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Os ajustes: base cinza suave, um cartão por assunto (6.2) */}
        <aside aria-label="Ajustes do mapa" className="flex max-h-[45svh] min-h-0 shrink-0 flex-col border-t border-border bg-muted/50 md:max-h-none md:w-[24rem] md:border-l md:border-t-0">
          <OverlayScroll data-panel-scroll className="p-4">
            <div className="space-y-4">
              <PanelCard title="Título" caption="Aparece no alto da folha.">
                <Input aria-label="Título do mapa" value={title} onChange={(e) => setTyped(e.target.value)} />
                {typed !== null && typed !== automatic && (
                  <button type="button" onClick={() => setTyped(null)} className={cn('mt-3 flex h-10 items-center gap-2 px-2 text-sm font-medium', controlItem())}>
                    <Undo2 className="h-4 w-4" aria-hidden />
                    Voltar ao título automático
                  </button>
                )}
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

              <PanelCard title="O que aparece na folha" caption="Título, legenda e fonte dos dados sempre saem.">
                <ul className="-my-1">
                  {PARTS.map(({ id, label }) => (
                    // a linha toda liga e desliga (19.1): o interruptor é sempre a última coluna
                    <li key={id}>
                      <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-sm px-1 py-2 text-sm transition-colors duration-200 hover:bg-muted">
                        <span>{label}</span>
                        <Switch checked={show[id]} onCheckedChange={(on) => setShow((s) => ({ ...s, [id]: on }))} aria-label={label} />
                      </label>
                    </li>
                  ))}
                </ul>
              </PanelCard>

              <PanelCard title="Coordenadas" caption={show.grid ? 'Em graus, minutos e segundos, ou em UTM. Datum SIRGAS 2000.' : 'Ligue a grade para escolher como as coordenadas aparecem.'}>
                <Segmented label="Formato das coordenadas" value={coords} options={COORD_OPTIONS} onChange={setCoords} disabled={!show.grid} />
              </PanelCard>

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
                        onClick={() => { setBasemap(key); if (key === basemap) setRetry((n) => n + 1) }}
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
          </OverlayScroll>
        </aside>
      </div>
    </div>
  )
}

// O mapa dentro da moldura da folha. Quando a moldura muda de tamanho (outro papel, outra posição, janela maior), o zoom
// acompanha: o que a pessoa via continua à vista, em vez de o mapa mostrar mais ou menos terra sem aviso.
interface SheetMapProps {
  session: GerarMapaSession
  style: Json
  basemap: BasemapKey
  /** tamanho do mapa na tela (px) e no papel (mm de largura): a escala depende dos dois */
  frame: Size
  frameMm: number
  pxPerMm: number
  /** formato da grade; null: sem grade */
  grid: GridFormat | null
  north: boolean
  scale: boolean
  onSettle: (center: { lng: number; lat: number }) => void
}

function SheetMap({ session, style, basemap, frame, frameMm, pxPerMm, grid, north, scale, onSettle }: SheetMapProps) {
  const mapRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  useSmoothWheelZoom(mapRef, loaded)

  // a vista ao vivo: a escala e a grade se refazem a cada quadro do movimento (no máximo um por quadro de tela)
  const [view, setView] = useState<MapView | null>(null)
  const raf = useRef(0)
  const readView = useCallback(() => {
    raf.current = 0
    const map = mapRef.current?.getMap()
    if (!map) return
    const b = map.getBounds()
    setView({ lat: map.getCenter().lat, zoom: map.getZoom(), bounds: { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() } })
  }, [])
  const scheduleView = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(readView) }, [readView])
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])
  // a moldura mudou de tamanho: a vista (limites e escala) muda junto
  useEffect(() => { if (loaded) scheduleView() }, [frame.w, frame.h, loaded, scheduleView])

  const initial = useMemo(
    () => ({ longitude: session.camera.lng, latitude: session.camera.lat, zoom: zoomToFit(session.camera.zoom, session.viewport, frame), bearing: 0, pitch: 0 }),
    // só o primeiro enquadramento: depois quem manda é a pessoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const previous = useRef(frame)
  useEffect(() => {
    const map = mapRef.current?.getMap()
    const before = previous.current
    previous.current = frame
    if (!map || !loaded || (before.w === frame.w && before.h === frame.h)) return
    map.jumpTo({ zoom: zoomToFit(map.getZoom(), before, frame) })
    scheduleView()
  }, [frame, loaded, scheduleView])

  return (
    <div className="relative h-full w-full">
    <Map
      ref={mapRef}
      initialViewState={initial}
      style={{ width: '100%', height: '100%' }}
      mapStyle={style as any}
      maxZoom={BASEMAP_MAX_ZOOM[basemap]}
      // a roda tem zoom próprio (13.7); a folha é sempre com o norte para cima (a seta do norte depende disso)
      scrollZoom={false}
      dragRotate={false}
      pitchWithRotate={false}
      touchPitch={false}
      keyboard={false}
      attributionControl={false}
      onLoad={(e) => { e.target.touchZoomRotate.disableRotation(); setLoaded(true) }}
      onMove={scheduleView}
      onMoveEnd={() => { const c = mapRef.current?.getMap().getCenter(); if (c) onSettle({ lng: c.lng, lat: c.lat }) }}
    >
      {session.iconLayers.map(({ layer, data }) => (
        <MaplibreIconMarkers key={layer.slug} layer={layer} data={data} onFeatureClick={() => {}} onFeatureHover={() => {}} />
      ))}
    </Map>
    {view && grid && <GridOverlay map={mapRef.current.getMap()} view={view} format={grid} frame={frame} pxPerMm={pxPerMm} />}
    {view && north && <NorthArrow pxPerMm={pxPerMm} />}
    {view && scale && <ScaleBlock view={view} frame={{ mm: frameMm, px: frame.w }} pxPerMm={pxPerMm} />}
    </div>
  )
}
