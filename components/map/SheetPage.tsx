'use client'

import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { cn } from '@/lib/utils'
import type { GerarMapaSession } from './GerarMapa'
import { MaplibreIconMarkers } from './MaplibreIconMarkers'
import { GridOverlay, LegendBlock, LocationInset, NoteBlock, NorthArrow, ScaleBlock, type MapView } from './SheetOverlays'
import { BASEMAP_MAX_ZOOM, type BasemapKey } from './helpers/basemaps'
import { datumLine, type GridFormat } from './helpers/grid'
import type { LegendSection } from './helpers/legend-sheet'
import { sheetLayout, zoomToFit, type Corner, type Orientation, type Paper, type placeCorners } from './helpers/sheet'
import { useSmoothWheelZoom } from './helpers/use-smooth-wheel-zoom'

// A folha (Gerar mapa): título, mapa com tudo por cima e rodapé, no tamanho do papel. O mesmo componente desenha a folha da tela
// (interativa) e a folha de exportação (fora da tela, no tamanho real do papel e sem interação): o arquivo sai igual ao que se vê.

export type Json = Record<string, any>
export interface Size { w: number; h: number }
export interface Camera { lng: number; lat: number; zoom: number }

/** o que a folha pode mostrar a mais: ligado por padrão, a pessoa desliga o que não quer (título, legenda e fonte dos dados não saem) */
export type Part = 'north' | 'scale' | 'grid' | 'datum' | 'date' | 'logos' | 'inset' | 'note'

export interface SheetSettings {
  paper: Paper
  orientation: Orientation
  title: string
  show: Record<Part, boolean>
  coords: GridFormat
  note: string
  corners: ReturnType<typeof placeCorners>
  legend: { title: string; sections: LegendSection[] }
  credits: string
  today: string
  brasaoUrl: string | null
  /** onde o mapa está quando assenta: o fuso do rodapé vem daqui */
  center: { lng: number; lat: number }
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
}

export const SheetPage = forwardRef<HTMLDivElement, SheetPageProps>(function SheetPage(
  { settings, session, style, baseStyle, basemap, px, initialCamera, interactive = true, pixelRatio, onSettle, onIdle, cameraProbe },
  ref,
) {
  const { show, corners } = settings
  const sheet = useMemo(() => sheetLayout(settings.paper, settings.orientation), [settings.paper, settings.orientation])
  const mm = (v: number) => v * px
  const frame: Size = { w: Math.round(sheet.map.w * px), h: Math.round(sheet.map.h * px) }

  return (
    <div
      ref={ref}
      className={cn('relative overflow-clip rounded-sm bg-card', interactive && 'shadow-control transition-[width,height] duration-[320ms] ease-spring')}
      style={{ width: mm(sheet.width), height: mm(sheet.height) }}
    >
      <div className="absolute flex items-end" style={{ left: mm(sheet.header.x), top: mm(sheet.header.y), width: mm(sheet.header.w), height: mm(sheet.header.h) }}>
        <h1 className="line-clamp-2 min-w-0 flex-1 font-semibold leading-tight text-foreground" style={{ fontSize: mm(6) }}>
          {settings.title}
        </h1>
        {show.logos && (
          <div className="flex shrink-0 items-center" style={{ gap: mm(3), marginLeft: mm(4), height: mm(12) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {settings.brasaoUrl && <img src={settings.brasaoUrl} alt="Brasão" className="h-full w-auto object-contain" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/prisma_logo_revert.png" alt="GEO PRISMA" className="h-full w-auto object-contain" />
          </div>
        )}
      </div>

      <div
        className="absolute overflow-clip border border-foreground bg-muted [&_.maplibregl-marker]:pointer-events-none"
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
            north={show.north}
            scale={show.scale}
            inset={show.inset}
            insetStyle={baseStyle}
            note={show.note ? settings.note : ''}
            legend={settings.legend}
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
    </div>
  )
})

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
  inset: boolean
  insetStyle: Json | null
  note: string
  legend: { title: string; sections: LegendSection[] }
  corners: ReturnType<typeof placeCorners>
  mapHeightMm: number
  initialCamera?: Camera
  interactive: boolean
  pixelRatio?: number
  onSettle?: (camera: Camera) => void
  onIdle?: () => void
  cameraProbe?: MutableRefObject<(() => Camera | null) | null>
}

function SheetMap({ session, style, basemap, frame, frameMm, pxPerMm, grid, north, scale, inset, insetStyle, note, legend, corners, mapHeightMm, initialCamera, interactive, pixelRatio, onSettle, onIdle, cameraProbe }: SheetMapProps) {
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
        interactive={interactive}
        // a roda tem zoom próprio (13.7); a folha é sempre com o norte para cima (a seta do norte depende disso)
        scrollZoom={false}
        dragRotate={false}
        pitchWithRotate={false}
        touchPitch={false}
        keyboard={false}
        attributionControl={false}
        // a folha de exportação precisa de pixels para ler do mapa e de resolução de 300 dpi
        pixelRatio={pixelRatio}
        canvasContextAttributes={{ preserveDrawingBuffer: true, antialias: true }}
        onLoad={(e) => { e.target.touchZoomRotate.disableRotation(); setLoaded(true) }}
        onIdle={() => onIdle?.()}
        onMove={scheduleView}
        onMoveEnd={() => {
          const map = mapRef.current?.getMap()
          if (!map) return
          const c = map.getCenter()
          setSettled({ lng: c.lng, lat: c.lat })
          onSettle?.({ lng: c.lng, lat: c.lat, zoom: map.getZoom() })
        }}
      >
        {session.iconLayers.map(({ layer, data }) => (
          <MaplibreIconMarkers key={layer.slug} layer={layer} data={data} onFeatureClick={() => {}} onFeatureHover={() => {}} />
        ))}
      </Map>
      {view && grid && <GridOverlay map={mapRef.current.getMap()} view={view} format={grid} frame={frame} pxPerMm={pxPerMm} />}
      {view && north && <NorthArrow pxPerMm={pxPerMm} corner={corners.north} />}
      {view && scale && <ScaleBlock view={view} frame={{ mm: frameMm, px: frame.w }} pxPerMm={pxPerMm} corner={corners.scale} />}
      <LegendBlock title={legend.title} sections={legend.sections} corner={corners.legend} pxPerMm={pxPerMm} mapHeightMm={mapHeightMm} />
      {view && inset && insetStyle && <LocationInset style={insetStyle} view={view} center={settled} pxPerMm={pxPerMm} corner={corners.inset} />}
      <NoteBlock text={note} pxPerMm={pxPerMm} />
    </div>
  )
}
