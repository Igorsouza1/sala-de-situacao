'use client'

import '@/lib/maplibre-worker'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { forwardRef, memo, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { cn } from '@/lib/utils'
import type { GerarMapaSession } from './GerarMapa'
import { MaplibreIconMarkers } from './MaplibreIconMarkers'
import { GridLines, GridMarginLabels, LegendBlock, FreeBlocks, LegendPanel, LocationInset, NorthArrow, ScaleBlock, projectGrid, type MapView } from './SheetOverlays'
import { BASEMAP_MAX_ZOOM, type BasemapKey } from './helpers/basemaps'
import { GRID_LEVELS, type GridNumbers, type MarkerLook, type MapBlock, type NorthStyle, type Part } from './helpers/gerar-mapa'
import { datumLine, type GridFormat } from './helpers/grid'
import type { LegendSection } from './helpers/legend-sheet'
import { DRAG_PAN } from './helpers/map-feel'
import { sheetLayout, zoomToFit, type Orientation, type Paper, type Sheet, type placeCorners } from './helpers/sheet'
import { useSmoothWheelZoom } from './helpers/use-smooth-wheel-zoom'

// A folha (Gerar mapa): título, mapa com tudo por cima e rodapé, no tamanho do papel. O mesmo componente desenha a folha da tela
// (interativa) e a folha de exportação (fora da tela, no tamanho real do papel e sem interação): o arquivo sai igual ao que se vê.

export type Json = Record<string, any>
export interface Size { w: number; h: number }
export interface Camera { lng: number; lat: number; zoom: number }

export type { Part }

export interface SheetSettings {
  paper: Paper
  orientation: Orientation
  title: string
  show: Record<Part, boolean>
  coords: GridFormat
  /** o grau da linha da grade (0 a 4, índice de GRID_LEVELS) e onde ficam os números */
  gridLevel: number
  gridNumbers: GridNumbers
  northStyle: NorthStyle
  /** ícone ou ponto das ações, em qualquer zoom (auto: o zoom decide) */
  markerLook: MarkerLook
  /** a legenda fora do mapa, na coluna ao lado (só na folha deitada) */
  legendSide: boolean
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
export function layoutOf(s: Pick<SheetSettings, 'paper' | 'orientation' | 'legendSide' | 'show' | 'gridNumbers'>): Sheet {
  return sheetLayout(s.paper, s.orientation, {
    side: s.legendSide,
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
  /** de onde o mapa parte; sem isso, da câmera do mapa principal ajustada à moldura */
  initialCamera?: Camera
  /** false na folha de exportação: sem arrasto, sem zoom, sem transição */
  interactive?: boolean
  pixelRatio?: number
  onSettle?: (camera: Camera) => void
  onIdle?: () => void
  /** a tela guarda aqui uma função que lê onde o mapa está agora (para exportar exatamente este enquadramento) */
  cameraProbe?: MutableRefObject<(() => Camera | null) | null>
  /** o bloco de texto escolhido, o recém-criado (já com o cursor dentro) e o que fazer ao escolher, mover ou escrever (só na tela) */
  selectedBlock?: string | null
  focusBlock?: string | null
  onBlockSelect?: (id: string | null) => void
  onBlockMove?: (id: string, x: number, y: number) => void
  onBlockEdit?: (id: string, text: string) => void
}

export const SheetPage = forwardRef<HTMLDivElement, SheetPageProps>(function SheetPage(
  { settings, session, style, baseStyle, basemap, px, initialCamera, interactive = true, pixelRatio, onSettle, onIdle, cameraProbe, selectedBlock, focusBlock, onBlockSelect, onBlockMove, onBlockEdit },
  ref,
) {
  const { show, corners } = settings
  // a legenda sobre o mapa: o mesmo objeto enquanto o conteúdo não mudar (mexer num texto não refaz o mapa)
  const legend = useMemo(
    () => (settings.legendSide && settings.orientation === 'landscape' ? null : { title: settings.legend.title, sections: settings.legend.sections }),
    [settings.legendSide, settings.orientation, settings.legend.title, settings.legend.sections],
  )
  const sheet = useMemo(
    () => layoutOf({ paper: settings.paper, orientation: settings.orientation, legendSide: settings.legendSide, show: settings.show, gridNumbers: settings.gridNumbers }),
    [settings.paper, settings.orientation, settings.legendSide, settings.show, settings.gridNumbers],
  )
  const mm = (v: number) => v * px
  const frame: Size = { w: Math.round(sheet.map.w * px), h: Math.round(sheet.map.h * px) }

  return (
    <div
      ref={ref}
      className={cn('relative overflow-clip rounded-sm bg-card', interactive && 'shadow-control transition-[width,height] duration-[320ms] ease-spring')}
      style={{ width: mm(sheet.width), height: mm(sheet.height) }}
    >
      <div className="absolute flex items-end" style={{ left: mm(sheet.header.x), top: mm(sheet.header.y), width: mm(sheet.header.w), height: mm(sheet.header.h) }}>
        {settings.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logoUrl} alt="Logo" className="w-auto shrink-0 object-contain" style={{ height: mm(12), marginRight: mm(4) }} />
        )}
        <h1 className="line-clamp-2 min-w-0 flex-1 font-semibold leading-tight text-foreground" style={{ fontSize: mm(6) }}>
          {settings.title}
        </h1>
      </div>

      <div
        className="absolute [&_.maplibregl-marker]:pointer-events-none"
        style={{ left: mm(sheet.map.x), top: mm(sheet.map.y), width: mm(sheet.map.w), height: mm(sheet.map.h) }}
      >
        {frame.w > 0 && frame.h > 0 && (
          <SheetMap
            session={session}
            style={style}
            basemap={basemap}
            frame={frame}
            frameMm={sheet.map.w}
            pxPerMm={px}
            grid={show.grid ? settings.coords : null}
            gridLevel={GRID_LEVELS[settings.gridLevel] ?? 1}
            gridNumbers={settings.gridNumbers}
            gridMarginMm={sheet.gridMargin}
            north={show.north}
            northStyle={settings.northStyle}
            markerLook={settings.markerLook}
            scale={show.scale}
            inset={show.inset}
            insetStyle={baseStyle}
            onBackgroundPress={() => onBlockSelect?.(null)}
            legend={legend}
            corners={corners}
            mapHeightMm={sheet.map.h}
            initialCamera={initialCamera}
            interactive={interactive}
            pixelRatio={pixelRatio}
            onSettle={onSettle}
            onIdle={onIdle}
            cameraProbe={cameraProbe}
          />
        )}
      </div>

      {sheet.side && (
        <div className="absolute" style={{ left: mm(sheet.side.x), top: mm(sheet.side.y), width: mm(sheet.side.w), height: mm(sheet.side.h) }}>
          <LegendPanel title={settings.legend.title} sections={settings.legend.sections} pxPerMm={px} maxHeightMm={sheet.side.h} />
        </div>
      )}

      <div
        className="absolute flex flex-col justify-start text-muted-foreground"
        style={{ left: mm(sheet.footer.x), top: mm(sheet.footer.y), width: mm(sheet.footer.w), height: mm(sheet.footer.h), fontSize: mm(2.6), gap: mm(1) }}
      >
        <div className="flex items-start justify-between" style={{ gap: mm(4) }}>
          <p className="shrink-0">Dados: GEO PRISMA{show.date && ` · ${settings.today}`}</p>
          {show.datum && <p className="min-w-0 text-right">{datumLine(settings.coords, settings.center.lng, settings.center.lat)}</p>}
        </div>
        {settings.credits && <p className="text-right">Mapa de fundo: {settings.credits}</p>}
      </div>

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
  inset: boolean
  insetStyle: Json | null
  /** um toque no mapa (que não é num texto) encerra a escolha do texto */
  onBackgroundPress?: () => void
  /** null: a legenda está na coluna ao lado, não sobre o mapa */
  legend: { title: string; sections: LegendSection[] } | null
  corners: ReturnType<typeof placeCorners>
  mapHeightMm: number
  initialCamera?: Camera
  interactive: boolean
  pixelRatio?: number
  onSettle?: (camera: Camera) => void
  onIdle?: () => void
  cameraProbe?: MutableRefObject<(() => Camera | null) | null>
}

const SheetMap = memo(function SheetMap({ session, style, basemap, frame, frameMm, pxPerMm, grid, gridLevel, gridNumbers, gridMarginMm, north, northStyle, markerLook, scale, inset, insetStyle, onBackgroundPress, legend, corners, mapHeightMm, initialCamera, interactive, pixelRatio, onSettle, onIdle, cameraProbe }: SheetMapProps) {
  const [settled, setSettled] = useState({ lng: initialCamera?.lng ?? session.camera.lng, lat: initialCamera?.lat ?? session.camera.lat })
  const mapRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  useSmoothWheelZoom(mapRef, loaded && interactive)

  useEffect(() => {
    if (!cameraProbe) return
    cameraProbe.current = () => {
      const map = mapRef.current?.getMap()
      if (!map) return null
      const c = map.getCenter()
      return { lng: c.lng, lat: c.lat, zoom: map.getZoom() }
    }
    return () => { cameraProbe.current = null }
  }, [cameraProbe])

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
  // a moldura mudou de tamanho: a vista (limites e escala) muda junto
  useEffect(() => { if (loaded) { scheduleView(); setRestView(measure()) } }, [frame.w, frame.h, loaded, scheduleView, measure])

  // a grade desta vista, em pixels da tela: as linhas e os números (dentro ou na margem) saem da mesma conta
  const gridLines = useMemo(() => {
    const map = mapRef.current?.getMap()
    return view && grid && map ? projectGrid(map, view, grid) : null
  }, [view, grid])

  const initial = useMemo(
    () => ({
      longitude: initialCamera?.lng ?? session.camera.lng,
      latitude: initialCamera?.lat ?? session.camera.lat,
      zoom: initialCamera?.zoom ?? zoomToFit(session.camera.zoom, session.viewport, frame),
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
      <div className="absolute inset-0 overflow-clip border border-foreground bg-muted" onPointerDownCapture={onBackgroundPress}>
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
        onIdle={() => onIdle?.()}
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
      {gridLines && <GridLines lines={gridLines} frame={frame} pxPerMm={pxPerMm} level={gridLevel} numbers={gridNumbers} />}
      {view && north && <NorthArrow pxPerMm={pxPerMm} corner={corners.north} style={northStyle} />}
      {view && scale && <ScaleBlock view={view} frame={{ mm: frameMm, px: frame.w }} pxPerMm={pxPerMm} corner={corners.scale} />}
      {legend && corners.legend && <LegendBlock title={legend.title} sections={legend.sections} corner={corners.legend} pxPerMm={pxPerMm} mapHeightMm={mapHeightMm} />}
      {restView && inset && insetStyle && <LocationInset style={insetStyle} view={restView} center={settled} pxPerMm={pxPerMm} corner={corners.inset} />}
      </div>
      {gridLines && gridNumbers === 'margin' && gridMarginMm > 0 && <GridMarginLabels lines={gridLines} frame={frame} pxPerMm={pxPerMm} marginMm={gridMarginMm} />}
    </div>
  )
})
