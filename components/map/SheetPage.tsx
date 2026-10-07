'use client'

import '@/lib/maplibre-worker'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type MutableRefObject, type PointerEvent } from 'react'
import { cn } from '@/lib/utils'
import type { GerarMapaSession } from './GerarMapa'
import { MaplibreIconMarkers } from './MaplibreIconMarkers'
import { CoverageBoxes, GridLines, GridMarginLabels, LegendBand, LegendBlock, FreeBlocks, LegendPanel, LocationInset, NorthArrow, PanelBadge, ScaleBlock, projectGrid, type Coverage, type MapView } from './SheetOverlays'
import { seedCamera, type Bounds } from './helpers/sheet-panels'
import { BASEMAP_MAX_ZOOM, type BasemapKey } from './helpers/basemaps'
import { GRID_LEVELS, type TitleAlign, type GridNumbers, type MarkerLook, type MapBlock, type NorthStyle, type Part } from './helpers/gerar-mapa'
import { datumLine, type GridFormat } from './helpers/grid'
import { legendRowCount, type LegendSection } from './helpers/legend-sheet'
import { DRAG_PAN } from './helpers/map-feel'
import { HEADER_PAD_MM, LOGO_SLOT_MM, sheetLayout, titleLayout, zoomToFit, type LegendPlace, type Orientation, type Paper, type Sheet, type SheetModel, type placeCorners } from './helpers/sheet'
import { useSmoothWheelZoom } from './helpers/use-smooth-wheel-zoom'
import type { LegendOpacity } from './helpers/legend-opacity'
import { SHEET_TARGETS, isSheetTarget, type SheetTarget } from './helpers/gerar-sections'

// A folha (Gerar mapa): título, mapa com tudo por cima e rodapé, no tamanho do papel. O mesmo componente desenha a folha da tela
// (interativa) e a folha de exportação (fora da tela, no tamanho real do papel e sem interação): o arquivo sai igual ao que se vê.

// O nome, com o espectro de um prisma passando pelas letras (rosa, vermelho, âmbar, verde, azul, violeta). O fundo recortado no texto
// também sai no PDF e no PNG: a fotografia da folha é feita pelo próprio navegador.
const SPECTRUM = 'linear-gradient(100deg, var(--color-prism-rosa), var(--color-crit) 22%, var(--color-warn) 40%, var(--color-ok) 60%, var(--color-water) 80%, var(--color-prism-violeta))'

function PrismaMark({ mm }: { mm: (v: number) => number }) {
  return (
    <span
      className="font-bold leading-none tracking-wide"
      style={{ fontSize: mm(4.4), backgroundImage: SPECTRUM, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}
    >
      Prisma
    </span>
  )
}

export type Json = Record<string, any>
export interface Size { w: number; h: number }
export interface Camera { lng: number; lat: number; zoom: number }

export type { Part }

export interface SheetSettings {
  paper: Paper
  orientation: Orientation
  /** um mapa, dois lado a lado, ou um grande com detalhes; e quantos detalhes */
  model: SheetModel
  detailCount: number
  title: string
  show: Record<Part, boolean>
  coords: GridFormat
  /** o grau da linha da grade (0 a 4, índice de GRID_LEVELS) e onde ficam os números */
  gridLevel: number
  gridNumbers: GridNumbers
  northStyle: NorthStyle
  /** onde o título (e a linha de apoio) ficam na faixa */
  titleAlign: TitleAlign
  /** ícone ou ponto das ações, em qualquer zoom (auto: o zoom decide) */
  markerLook: MarkerLook
  /** onde a legenda fica: sobre o mapa principal, na coluna ao lado (só na folha deitada) ou na faixa embaixo dos mapas */
  legendPlace: LegendPlace
  /** o fundo da legenda quando ela está sobre o mapa */
  legendOpacity: LegendOpacity
  /** textos soltos na folha */
  blocks: MapBlock[]
  corners: ReturnType<typeof placeCorners>
  legend: { title: string; sections: LegendSection[] }
  credits: string
  today: string
  /** o logo que a pessoa enviou (data URL); sem ele, o título ocupa o espaço */
  logoUrl: string | null
  /** onde o mapa está quando assenta: o fuso do rodapé vem daqui */
  center: { lng: number; lat: number }
}

/** a folha que estas escolhas pedem: legenda ao lado e números da grade na margem tiram área do mapa */
export function layoutOf(s: Pick<SheetSettings, 'paper' | 'orientation' | 'legendPlace' | 'legend' | 'show' | 'gridNumbers' | 'title' | 'logoUrl' | 'titleAlign' | 'model' | 'detailCount'>): Sheet {
  return sheetLayout(s.paper, s.orientation, {
    model: s.model,
    details: s.detailCount,
    headerLines: titleLayout(s.title, s.paper, s.orientation, !!s.logoUrl, s.titleAlign === 'center').lines === 2 ? 2 : 1,
    side: s.legendPlace === 'side',
    below: s.legendPlace === 'below',
    legendRows: legendRowCount(s.legend.sections),
    gridMargin: s.show.grid && s.gridNumbers === 'margin',
  })
}

export interface SheetPageProps {
  settings: SheetSettings
  session: GerarMapaSession
  /** a base escolhida com as camadas de dados por cima */
  style: Json
  /** só a base: o mapa de localização a usa */
  baseStyle: Json | null
  basemap: BasemapKey
  /** pixels por milímetro do papel: o tamanho com que a folha aparece */
  px: number
  /** de onde cada mapa parte, pelo id do painel; sem isso, o principal parte da câmera do mapa principal ajustada à moldura e os outros do que o sistema propõe */
  initialCameras?: Record<string, Camera>
  /** false na folha de exportação: sem arrasto, sem zoom, sem transição */
  interactive?: boolean
  pixelRatio?: number
  onSettle?: (camera: Camera) => void
  onIdle?: () => void
  /** a tela guarda aqui, por painel, uma função que lê onde o mapa está agora (para exportar exatamente este enquadramento) */
  cameraProbes?: MutableRefObject<Record<string, () => Camera | null>>
  /** o painel que se move (só nos modelos com mais de um mapa) e o que fazer ao tocar noutro para escolhê-lo */
  selectedPanel?: string
  onPanelSelect?: (id: string) => void
  /** o bloco de texto escolhido, o recém-criado (já com o cursor dentro) e o que fazer ao escolher, mover ou escrever (só na tela) */
  selectedBlock?: string | null
  focusBlock?: string | null
  onBlockSelect?: (id: string | null) => void
  onBlockMove?: (id: string, x: number, y: number) => void
  onBlockEdit?: (id: string, text: string) => void
  /** tocar no título, na legenda, na escala, no norte ou na localização leva ao ajuste dele (só na tela) */
  onTarget?: (target: SheetTarget) => void
}

export const SheetPage = forwardRef<HTMLDivElement, SheetPageProps>(function SheetPage(
  { settings, session, style, baseStyle, basemap, px, initialCameras, interactive = true, pixelRatio, onSettle, onIdle, cameraProbes, selectedPanel, onPanelSelect, selectedBlock, focusBlock, onBlockSelect, onBlockMove, onBlockEdit, onTarget },
  ref,
) {
  const { show, corners } = settings
  // a legenda sobre o mapa: o mesmo objeto enquanto o conteúdo não mudar (mexer num texto não refaz o mapa)
  const legend = useMemo(
    () => (settings.legendPlace === 'over' ? { title: settings.legend.title, sections: settings.legend.sections } : null),
    [settings.legendPlace, settings.legend.title, settings.legend.sections],
  )
  const sheet = useMemo(
    () => layoutOf({ paper: settings.paper, orientation: settings.orientation, legendPlace: settings.legendPlace, legend: settings.legend, show: settings.show, gridNumbers: settings.gridNumbers, title: settings.title, logoUrl: settings.logoUrl, titleAlign: settings.titleAlign, model: settings.model, detailCount: settings.detailCount }),
    [settings.paper, settings.orientation, settings.legendPlace, settings.legend, settings.show, settings.gridNumbers, settings.title, settings.logoUrl, settings.titleAlign, settings.model, settings.detailCount],
  )
  const mm = (v: number) => v * px
  // o espaço do título: a faixa menos o respiro dos lados e o logo
  const align = settings.titleAlign
  const title = titleLayout(settings.title, settings.paper, settings.orientation, !!settings.logoUrl, align === 'center')
  const frame: Size = { w: Math.round(sheet.map.w * px), h: Math.round(sheet.map.h * px) }

  // ── vários mapas: câmeras, cobertura dos detalhes e o "todos prontos" da exportação ──
  const multi = sheet.panels.length > 1
  const mainPanel = sheet.panels[0]
  const internalProbes = useRef<Record<string, () => Camera | null>>({})
  const probes = cameraProbes ?? internalProbes
  // o que cada detalhe cobre, lido do próprio detalhe a cada movimento; o mapa grande desenha os retângulos
  const [bounds, setBounds] = useState<Record<string, Bounds>>({})
  const onPanelView = useCallback((id: string, b: Bounds) => {
    setBounds((all) => {
      const old = all[id]
      return old && old.west === b.west && old.east === b.east && old.north === b.north && old.south === b.south ? all : { ...all, [id]: b }
    })
  }, [])
  const coverage = useMemo<Coverage[]>(
    () => (settings.model === 'details' ? sheet.panels.slice(1).flatMap((p) => (bounds[p.id] && p.label ? [{ id: p.id, label: p.label, bounds: bounds[p.id] }] : [])) : []),
    [settings.model, sheet.panels, bounds],
  )
  // a folha de exportação só pode ser fotografada quando TODOS os mapas pararam de carregar
  const idle = useRef(new Set<string>())
  const panelCount = useRef(sheet.panels.length)
  panelCount.current = sheet.panels.length
  const onPanelIdle = useCallback((id: string) => {
    idle.current.add(id)
    if (idle.current.size >= panelCount.current) onIdle?.()
  }, [onIdle])
  // de onde um painel que não é o principal parte: a vista de agora do principal, ajustada pelo modelo (mais perto, espalhado)
  const seedFor = (index: number, count: number) => () => {
    const live = probes.current[mainPanel.id]?.()
    const base = live ?? { lng: session.camera.lng, lat: session.camera.lat, zoom: zoomToFit(session.camera.zoom, session.viewport, frame) }
    return seedCamera(settings.model, index, count, base, frame.w)
  }
  const selected = selectedPanel ?? mainPanel.id

  // A folha ao vivo é também o menu: o mouse sobre um alvo o contorna e diz o nome; tocar leva ao ajuste dele. Um só contorno, medido
  // do alvo, serve a todos (nada de estilo em cada elemento). No papel e no celular (sem mouse) não há contorno.
  const linked = interactive && !!onTarget
  const [hint, setHint] = useState<{ id: SheetTarget; x: number; y: number; w: number; h: number; on: boolean } | null>(null)
  const targetOf = (e: { target: EventTarget | null }) => {
    const el = (e.target as Element | null)?.closest?.('[data-target]') as HTMLElement | null | undefined
    const id = el?.dataset.target
    return el && isSheetTarget(id) ? { el, id } : null
  }
  const onOver = (e: PointerEvent<HTMLDivElement>) => {
    if (!linked || e.pointerType === 'touch') return
    const t = targetOf(e)
    if (!t) { setHint((h) => (h?.on ? { ...h, on: false } : h)); return }
    const root = e.currentTarget.getBoundingClientRect()
    const r = t.el.getBoundingClientRect()
    setHint({ id: t.id, x: r.left - root.left, y: r.top - root.top, w: r.width, h: r.height, on: true })
  }
  const onTap = (e: MouseEvent<HTMLDivElement>) => {
    if (!linked) return
    const t = targetOf(e)
    if (t) onTarget?.(t.id)
  }

  return (
    <div
      ref={ref}
      className={cn('relative overflow-clip rounded-sm bg-card', interactive && 'shadow-control transition-[width,height] duration-[320ms] ease-spring', linked && '[&_[data-target]]:cursor-pointer')}
      style={{ width: mm(sheet.width), height: mm(sheet.height) }}
      onPointerOver={onOver}
      onPointerLeave={() => setHint((h) => (h?.on ? { ...h, on: false } : h))}
      onClick={onTap}
    >
      <div
        data-target="titulo"
        className="absolute flex items-center overflow-clip rounded-sm border border-border bg-card text-foreground shadow-control"
        style={{ left: mm(sheet.header.x), top: mm(sheet.header.y), width: mm(sheet.header.w), height: mm(sheet.header.h), padding: `${mm(2.5)}px ${mm(HEADER_PAD_MM)}px ${mm(3.5)}px`, gap: mm(4) }}
      >
        {settings.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="Logo" className="absolute w-auto object-contain" style={{ height: mm(15), left: mm(HEADER_PAD_MM), top: '50%', translate: `0 calc(-50% - ${mm(0.5)}px)` }} />
        )}
        <div
          className={cn('min-w-0 flex-1', align === 'center' && 'text-center', align === 'right' && 'text-right')}
          // o logo fica solto à esquerda; o texto reserva o lugar dele (nos dois lados se centralizado, para o centro ser o da faixa)
          style={settings.logoUrl ? { paddingLeft: mm(LOGO_SLOT_MM), paddingRight: align === 'center' ? mm(LOGO_SLOT_MM) : 0 } : undefined}
        >
          <h1 className="font-semibold leading-tight" style={{ fontSize: mm(title.size), display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: title.lines, overflow: 'hidden' }}>
            {settings.title}
          </h1>
          <p className={cn('flex items-baseline leading-none text-muted-foreground', align === 'center' && 'justify-center', align === 'right' && 'justify-end')} style={{ fontSize: mm(3), marginTop: mm(1.4), gap: mm(1.6) }}>
            <PrismaMark mm={mm} />
            {show.date && <span>· {settings.today}</span>}
          </p>
        </div>
        {/* o filete de floresta: a única assinatura de cor do cabeçalho */}
        <span aria-hidden className="absolute inset-x-0 bottom-0 bg-primary" style={{ height: mm(1) }} />
      </div>

      {sheet.panels.map((panel, index) => {
        const pw = Math.round(panel.rect.w * px)
        const ph = Math.round(panel.rect.h * px)
        const isMain = panel.main
        return (
          <div
            key={panel.id}
            className="absolute [&_.maplibregl-marker]:pointer-events-none"
            style={{ left: mm(panel.rect.x), top: mm(panel.rect.y), width: mm(panel.rect.w), height: mm(panel.rect.h) }}
          >
            {pw > 0 && ph > 0 && (
              <SheetMap
                panelId={panel.id}
                label={panel.label}
                isMain={isMain}
                multi={multi}
                selected={selected === panel.id}
                onPick={interactive && multi ? () => onPanelSelect?.(panel.id) : undefined}
                pickTag={isMain && settings.model === 'details' ? 'Mover o mapa grande' : `Mover o painel ${panel.label ?? ''}`.trim()}
                coverage={isMain ? coverage : undefined}
                onView={isMain ? undefined : onPanelView}
                seed={isMain ? undefined : seedFor(index - 1, sheet.panels.length - 1)}
                session={session}
                style={style}
                basemap={basemap}
                frame={{ w: pw, h: ph }}
                frameMm={panel.rect.w}
                pxPerMm={px}
                // grade, norte, legenda e localização são só do mapa principal; os outros mapas levam a etiqueta e a escala
                grid={(isMain || settings.model === 'side') && show.grid ? settings.coords : null}
                gridLevel={GRID_LEVELS[settings.gridLevel] ?? 1}
                gridNumbers={settings.gridNumbers}
                gridMarginMm={isMain || settings.model === 'side' ? sheet.gridMargin : 0}
                north={isMain && show.north}
                northStyle={settings.northStyle}
                markerLook={settings.markerLook}
                scale={show.scale}
                // só os pequenos do modelo com detalhes levam a escala resumida; no lado a lado os dois são iguais
                compactScale={!isMain && settings.model === 'details'}
                inset={isMain && show.inset}
                insetStyle={baseStyle}
                onBackgroundPress={() => onBlockSelect?.(null)}
                legend={isMain ? legend : null}
                legendOpacity={settings.legendOpacity}
                corners={corners}
                mapHeightMm={panel.rect.h}
                initialCamera={initialCameras?.[panel.id]}
                interactive={interactive}
                pixelRatio={pixelRatio}
                onSettle={isMain ? onSettle : undefined}
                onIdle={onPanelIdle}
                cameraProbes={probes}
              />
            )}
          </div>
        )
      })}

      {sheet.band && <LegendBand title={settings.legend.title} sections={settings.legend.sections} rect={sheet.band} pxPerMm={px} />}

      {sheet.side && (
        <div className="absolute" style={{ left: mm(sheet.side.x), top: mm(sheet.side.y), width: mm(sheet.side.w), height: mm(sheet.side.h) }}>
          <LegendPanel title={settings.legend.title} sections={settings.legend.sections} pxPerMm={px} maxHeightMm={sheet.side.h} />
        </div>
      )}

      <div
        className="absolute flex flex-col justify-start text-muted-foreground"
        style={{ left: mm(sheet.footer.x), top: mm(sheet.footer.y), width: mm(sheet.footer.w), height: mm(sheet.footer.h), fontSize: mm(2.6), gap: mm(1) }}
      >
        {show.datum && <p className="text-right">{datumLine(settings.coords, settings.center.lng, settings.center.lat)}</p>}
        {settings.credits && <p className="text-right">Mapa de fundo: {settings.credits}</p>}
      </div>

      {linked && hint && (
        <>
          <div
            aria-hidden
            className={cn('pointer-events-none absolute z-20 rounded-sm ring-2 ring-primary transition-opacity duration-200', hint.on ? 'opacity-100' : 'opacity-0')}
            style={{ left: hint.x, top: hint.y, width: hint.w, height: hint.h }}
          />
          <span
            aria-hidden
            className={cn('pointer-events-none absolute z-20 whitespace-nowrap rounded-sm bg-primary px-2 py-1 text-xs font-medium leading-none text-primary-foreground transition-opacity duration-200', hint.on ? 'opacity-100' : 'opacity-0')}
            style={{ left: hint.x, top: hint.y >= 28 ? hint.y - 26 : hint.y + hint.h + 4 }}
          >
            {SHEET_TARGETS[hint.id].tag}
          </span>
        </>
      )}

      <FreeBlocks blocks={settings.blocks} pxPerMm={px} interactive={interactive} selected={selectedBlock} focusId={focusBlock} onSelect={onBlockSelect} onMove={onBlockMove} onEdit={onBlockEdit} />
    </div>
  )
})

const MAP_BOX = { width: '100%', height: '100%' } as const
const CANVAS = { preserveDrawingBuffer: true, antialias: true } as const
const NO_CLICK = () => {}

// O mapa dentro da moldura da folha. Quando a moldura muda de tamanho (outro papel, outra posição, janela maior), o zoom
// acompanha: o que a pessoa via continua à vista, em vez de o mapa mostrar mais ou menos terra sem aviso.
interface SheetMapProps {
  /** qual mapa da folha é este; `isMain`: o principal (grade, norte, legenda, localização); `multi`: a folha tem mais de um mapa */
  panelId: string
  label: string | null
  isMain: boolean
  multi: boolean
  /** o painel que se move; os outros ficam atrás de um toque que o escolhe (`onPick`), com a etiqueta `pickTag` ao passar o mouse */
  selected: boolean
  onPick?: () => void
  pickTag: string
  /** no mapa grande: o que cada detalhe cobre, em retângulos */
  coverage?: Coverage[]
  /** nos outros mapas: avisa o que cobrem a cada movimento */
  onView?: (id: string, bounds: Bounds) => void
  /** nos outros mapas: de onde partem, quando a pessoa ainda não os moveu */
  seed?: () => Camera
  session: GerarMapaSession
  style: Json
  basemap: BasemapKey
  /** tamanho do mapa na tela (px) e no papel (mm de largura): a escala depende dos dois */
  frame: Size
  frameMm: number
  pxPerMm: number
  /** formato da grade; null: sem grade */
  grid: GridFormat | null
  /** 0 a 1: só a linha da grade */
  gridLevel: number
  gridNumbers: GridNumbers
  /** a margem (mm) onde moram os números fora do mapa */
  gridMarginMm: number
  north: boolean
  northStyle: NorthStyle
  markerLook: MarkerLook
  scale: boolean
  compactScale: boolean
  inset: boolean
  insetStyle: Json | null
  /** um toque no mapa (que não é num texto) encerra a escolha do texto */
  onBackgroundPress?: () => void
  /** null: a legenda está na coluna ao lado, não sobre o mapa */
  legend: { title: string; sections: LegendSection[] } | null
  legendOpacity: LegendOpacity
  corners: ReturnType<typeof placeCorners>
  mapHeightMm: number
  initialCamera?: Camera
  interactive: boolean
  pixelRatio?: number
  onSettle?: (camera: Camera) => void
  onIdle?: (id: string) => void
  cameraProbes: MutableRefObject<Record<string, () => Camera | null>>
}

// onde ficam os elementos dos mapas que não são o principal: só a escala, embaixo à esquerda
const DETAIL_CORNERS = { legend: null, north: 'top-right', scale: 'bottom-left', inset: 'top-left' } as const

const SheetMap = memo(function SheetMap({ panelId, label, isMain, multi, selected, onPick, pickTag, coverage, onView, seed, session, style, basemap, frame, frameMm, pxPerMm, grid, gridLevel, gridNumbers, gridMarginMm, north, northStyle, markerLook, scale, compactScale, inset, insetStyle, onBackgroundPress, legend, legendOpacity, corners, mapHeightMm, initialCamera, interactive, pixelRatio, onSettle, onIdle, cameraProbes }: SheetMapProps) {
  // o ponto de partida deste mapa: o que veio da exportação, ou o que o sistema propõe (nos que não são o principal)
  const [start] = useState<Camera | null>(() => initialCamera ?? seed?.() ?? null)
  const [settled, setSettled] = useState({ lng: start?.lng ?? session.camera.lng, lat: start?.lat ?? session.camera.lat })
  const mapRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  useSmoothWheelZoom(mapRef, loaded && interactive)
  const cornersHere = isMain || !compactScale ? corners : DETAIL_CORNERS

  useEffect(() => {
    cameraProbes.current[panelId] = () => {
      const map = mapRef.current?.getMap()
      if (!map) return null
      const c = map.getCenter()
      return { lng: c.lng, lat: c.lat, zoom: map.getZoom() }
    }
    return () => { delete cameraProbes.current[panelId] }
  }, [cameraProbes, panelId])

  // a vista ao vivo: a escala e a grade se refazem a cada quadro do movimento (no máximo um por quadro de tela)
  const [view, setView] = useState<MapView | null>(null)
  // a vista de quando o mapa parou: o mapa de localização (um segundo mapa WebGL) e os marcadores só se refazem aqui, não a cada quadro do arrasto
  const [restView, setRestView] = useState<MapView | null>(null)
  const raf = useRef(0)
  const measure = useCallback((): MapView | null => {
    const map = mapRef.current?.getMap()
    if (!map) return null
    const b = map.getBounds()
    return { lat: map.getCenter().lat, zoom: map.getZoom(), bounds: { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() } }
  }, [])
  const readView = useCallback(() => {
    raf.current = 0
    const v = measure()
    if (v) setView(v)
  }, [measure])
  const scheduleView = useCallback(() => { if (!raf.current) raf.current = requestAnimationFrame(readView) }, [readView])
  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current) }, [])
  // os mapas que não são o principal avisam o que cobrem, para o mapa grande desenhar o retângulo
  useEffect(() => { if (view && onView) onView(panelId, view.bounds) }, [view, onView, panelId])
  // a moldura mudou de tamanho: a vista (limites e escala) muda junto
  useEffect(() => { if (loaded) { scheduleView(); setRestView(measure()) } }, [frame.w, frame.h, loaded, scheduleView, measure])

  // a grade desta vista, em pixels da tela: as linhas e os números (dentro ou na margem) saem da mesma conta
  const gridLines = useMemo(() => {
    const map = mapRef.current?.getMap()
    return view && grid && map ? projectGrid(map, view, grid) : null
  }, [view, grid])

  const initial = useMemo(
    () => ({
      longitude: start?.lng ?? session.camera.lng,
      latitude: start?.lat ?? session.camera.lat,
      zoom: start?.zoom ?? zoomToFit(session.camera.zoom, session.viewport, frame),
      bearing: 0,
      pitch: 0,
    }),
    // só o primeiro enquadramento: depois quem manda é a pessoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // os marcadores não dependem da vista: o mesmo elemento a cada quadro faz o React pular a refazê-los
  const markers = useMemo(
    () => session.iconLayers.map(({ layer, data }) => <MaplibreIconMarkers key={layer.slug} layer={layer} data={data} onFeatureClick={NO_CLICK} onFeatureHover={NO_CLICK} look={markerLook} />),
    [session.iconLayers, markerLook],
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
      <div className="absolute inset-0 overflow-clip bg-muted" style={{ border: `${Math.max(1, pxPerMm * 0.3)}px solid var(--color-foreground)` }} onPointerDownCapture={onBackgroundPress}>
      <Map
        ref={mapRef}
        initialViewState={initial}
        style={MAP_BOX}
        mapStyle={style as any}
        maxZoom={BASEMAP_MAX_ZOOM[basemap]}
        interactive={interactive}
        // o mesmo toque de arrastar do mapa principal (inércia ao soltar)
        dragPan={DRAG_PAN as any}
        // a roda tem zoom próprio (13.7); a folha é sempre com o norte para cima (a seta do norte depende disso)
        scrollZoom={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        keyboard={false}
        attributionControl={false}
        // a folha de exportação precisa de pixels para ler do mapa e de resolução de 300 dpi
        pixelRatio={pixelRatio}
        canvasContextAttributes={CANVAS}
        onLoad={(e) => { e.target.touchZoomRotate.disableRotation(); setLoaded(true) }}
        onIdle={() => onIdle?.(panelId)}
        onMove={scheduleView}
        onMoveEnd={() => {
          const map = mapRef.current?.getMap()
          if (!map) return
          const c = map.getCenter()
          setSettled({ lng: c.lng, lat: c.lat })
          setRestView(measure())
          onSettle?.({ lng: c.lng, lat: c.lat, zoom: map.getZoom() })
        }}
      >
        {markers}
      </Map>
      {/* nos modelos com mais de um mapa, o que não se move fica atrás de um toque que o escolhe; as peças de cima dele seguem clicáveis */}
      {onPick && !selected && (
        <button type="button" onClick={onPick} aria-label={pickTag} className="group absolute inset-0 cursor-pointer outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40">
          <span aria-hidden className="absolute inset-0 ring-2 ring-inset ring-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" />
          <span aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm bg-primary px-2 py-1 text-xs font-medium leading-none text-primary-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">{pickTag}</span>
        </button>
      )}
      {gridLines && <GridLines lines={gridLines} frame={frame} pxPerMm={pxPerMm} level={gridLevel} numbers={gridNumbers} />}
      {view && coverage && coverage.length > 0 && <CoverageBoxes map={mapRef.current?.getMap()} view={view} items={coverage} pxPerMm={pxPerMm} />}
      {view && north && isMain && <NorthArrow pxPerMm={pxPerMm} corner={cornersHere.north} style={northStyle} />}
      {view && scale && <ScaleBlock view={view} frame={{ mm: frameMm, px: frame.w }} pxPerMm={pxPerMm} corner={cornersHere.scale} compact={compactScale} />}
      {legend && corners.legend && isMain && <LegendBlock title={legend.title} sections={legend.sections} corner={corners.legend} pxPerMm={pxPerMm} mapHeightMm={mapHeightMm} opacity={legendOpacity} />}
      {restView && inset && insetStyle && <LocationInset style={insetStyle} view={restView} center={settled} pxPerMm={pxPerMm} corner={corners.inset} />}
      {label && <PanelBadge label={label} pxPerMm={pxPerMm} selected={interactive && multi && selected} />}
      {/* o painel que se move leva o contorno de floresta (só na tela) */}
      {interactive && multi && selected && <div aria-hidden className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-primary" />}
      </div>
      {gridLines && gridNumbers === 'margin' && gridMarginMm > 0 && <GridMarginLabels lines={gridLines} frame={frame} pxPerMm={pxPerMm} marginMm={gridMarginMm} />}
    </div>
  )
})
