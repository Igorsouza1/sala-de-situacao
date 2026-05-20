'use client'

import Map, {
  Source,
  Layer,
  NavigationControl,
  Popup,
  Marker,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import * as LucideIcons from 'lucide-react'
import type { LayerResponseDTO } from '@/types/map-dto'
import {
  resolveLayerType,
  toFillPaint,
  toCirclePaint,
  toLinePaint,
  type MapLibreLayerType,
} from './helpers/maplibre-layer'
import { LayerManager, type LayerManagerOption } from './LayerManager'
import { DateFilterControl } from './DateFilterControl'
import { PropertyFilterControl } from './PropertyFilterControl'
import { Modal } from './Modal'
import { EditAcaoModal } from './EditAcaoModal'
import { FeatureDetails } from './feature-details'
import { ShapefileUploader } from './ShapefileUploader'
import { MaplibreCoordinateInspector } from './MaplibreCoordinateInspector'
import { MaplibreSnapshotControl } from './MaplibreSnapshotControl'
import { MaplibreMeasureControl } from './MaplibreMeasureControl'
import { MaplibreFaunaHeatmapControl } from './MaplibreFaunaHeatmapControl'
import { useMapContext } from '@/context/GeoDataContext'
import { useUserRole } from '@/hooks/useUserRole'
import { getLayerLegendInfo } from './helpers/map-visuals'
import { Button } from '@/components/ui/button'

// ── Basemaps ────────────────────────────────────────────────────────────────
const BASEMAPS = {
  streets: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
} as const

type BasemapKey = keyof typeof BASEMAPS

// ── Measure helpers ──────────────────────────────────────────────────────────
type LngLat = [number, number] // [lng, lat]

const haversine = (p1: LngLat, p2: LngLat): number => {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(p2[1] - p1[1])
  const dLon = toRad(p2[0] - p1[0])
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(p1[1])) * Math.cos(toRad(p2[1])) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const sphericalArea = (pts: LngLat[]): number => {
  if (pts.length < 3) return 0
  const R = 6378137
  const toRad = (d: number) => (d * Math.PI) / 180
  let area = 0
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    area +=
      (toRad(p2[0]) - toRad(p1[0])) *
      (2 + Math.sin(toRad(p1[1])) + Math.sin(toRad(p2[1])))
  }
  return Math.abs((area * R * R) / 2)
}

// ── Types ────────────────────────────────────────────────────────────────────
type MeasureMode = 'distance' | 'area' | null

interface MapLibreMapProps {
  /** [lat, lng] — mesma convenção do Leaflet */
  center?: [number, number]
  zoom?: number
}

// Layers excluded from hover tooltip
const EXCLUDED_HOVER = ['propriedades', 'banhado']

export default function MapLibreMap({
  center = [-21.327773, -56.694734],
  zoom = 11,
}: MapLibreMapProps) {
  // ── Core layer state ────────────────────────────────────────────────────
  const [layers, setLayers] = useState<LayerResponseDTO[]>([])
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])
  const [loadingLayers, setLoadingLayers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [areaFilter, setAreaFilter] = useState<{
    minArea?: number
    maxArea?: number
  }>({})
  const [dataVersion, setDataVersion] = useState(0)
  const initializedRef = useRef(false)

  // ── Context / auth ──────────────────────────────────────────────────────
  const { modalData, openModal, closeModal, dateFilter, setDateFilter } =
    useMapContext()
  const { isAdmin } = useUserRole()
  const [selectedAcao, setSelectedAcao] = useState<any | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // ── Shapefile preview ───────────────────────────────────────────────────
  const [previewGeoJSON, setPreviewGeoJSON] = useState<{
    data: any
    color: string
  } | null>(null)

  // ── Hover tooltip ───────────────────────────────────────────────────────
  const [hoveredFeature, setHoveredFeature] = useState<Record<
    string,
    any
  > | null>(null)
  const [hoverCoords, setHoverCoords] = useState<LngLat | null>(null)

  // ── Coordinate inspector ────────────────────────────────────────────────
  const [coordInspectorActive, setCoordInspectorActive] = useState(false)
  const [inspectedCoord, setInspectedCoord] = useState<{
    lat: number
    lng: number
  } | null>(null)

  // ── Measure control ─────────────────────────────────────────────────────
  const [measureMode, setMeasureMode] = useState<MeasureMode>(null)
  const [measurePoints, setMeasurePoints] = useState<LngLat[]>([])
  const [measureDrawing, setMeasureDrawing] = useState(false)
  const [measureCursorPos, setMeasureCursorPos] = useState<LngLat | null>(null)

  // ── Fauna heatmap ───────────────────────────────────────────────────────
  const [faunaData, setFaunaData] = useState<[number, number, number][]>([])
  const [faunaHeatmapActive, setFaunaHeatmapActive] = useState(false)
  const [faunaLocationsActive, setFaunaLocationsActive] = useState(false)
  const [faunaLoading, setFaunaLoading] = useState(false)
  const [faunaFetched, setFaunaFetched] = useState(false)

  // ── Basemap ─────────────────────────────────────────────────────────────
  const [basemap, setBasemap] = useState<BasemapKey>('streets')

  // ── Map ref ─────────────────────────────────────────────────────────────
  const mapRef = useRef<any>(null)

  // ── Fetch layers ─────────────────────────────────────────────────────────
  const fetchLayers = useCallback(async () => {
    setLoadingLayers(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateFilter.startDate)
        params.append('startDate', dateFilter.startDate.toISOString())
      if (dateFilter.endDate)
        params.append('endDate', dateFilter.endDate.toISOString())
      if (areaFilter.minArea !== undefined)
        params.append('minArea', String(areaFilter.minArea))
      if (areaFilter.maxArea !== undefined)
        params.append('maxArea', String(areaFilter.maxArea))
      params.append('_t', String(Date.now()))

      const response = await fetch(`/api/map/layers?${params.toString()}`)
      if (response.ok) {
        const data: LayerResponseDTO[] = await response.json()
        setLayers(data.sort((a, b) => (a.ordering || 0) - (b.ordering || 0)))
        setDataVersion((prev) => prev + 1)
      } else {
        setError('Falha ao carregar camadas')
      }
    } catch {
      setError('Erro ao conectar com servidor')
    } finally {
      setLoadingLayers(false)
    }
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dateFilter.startDate?.toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dateFilter.endDate?.toISOString(),
    areaFilter.minArea,
    areaFilter.maxArea,
  ])

  // Initialize visibility once when layers first arrive
  useEffect(() => {
    if (!initializedRef.current && layers.length > 0) {
      const slugs: string[] = []
      layers.forEach((l) => {
        if (l.groups?.length) {
          l.groups.forEach((g) => slugs.push(`${l.slug}__${g.id}`))
        }
        slugs.push(l.slug)
      })
      setVisibleLayers(slugs)
      initializedRef.current = true
    }
  }, [layers])

  useEffect(() => {
    fetchLayers()
  }, [fetchLayers])

  // ── Fauna data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (
      (faunaHeatmapActive || faunaLocationsActive) &&
      !faunaFetched &&
      !faunaLoading
    ) {
      setFaunaLoading(true)
      fetch('/api/map/heatmap/fauna-exotica')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            setFaunaData(json.data)
            setFaunaFetched(true)
          }
        })
        .catch(console.error)
        .finally(() => setFaunaLoading(false))
    }
  }, [faunaHeatmapActive, faunaLocationsActive, faunaFetched, faunaLoading])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (measureMode) {
          if (measureDrawing) {
            setMeasureDrawing(false)
            setMeasureCursorPos(null)
          } else {
            setMeasureMode(null)
            setMeasurePoints([])
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [measureMode, measureDrawing])

  // ── Layer toggle handlers ─────────────────────────────────────────────────
  const handleLayerToggle = useCallback((slug: string, isChecked: boolean) => {
    setVisibleLayers((prev) =>
      isChecked ? [...prev, slug] : prev.filter((s) => s !== slug)
    )
  }, [])

  const handleGroupToggle = useCallback(
    (slugs: string[], isChecked: boolean) => {
      setVisibleLayers((prev) => {
        if (isChecked)
          return [...prev, ...slugs.filter((s) => !prev.includes(s))]
        return prev.filter((s) => !slugs.includes(s))
      })
    },
    []
  )

  const handleToggleAll = useCallback(
    (isChecked: boolean) => {
      if (isChecked) {
        const all: string[] = []
        layers.forEach((l) => {
          if (l.groups?.length) {
            l.groups.forEach((g) => all.push(`${l.slug}__${g.id}`))
          }
          all.push(l.slug)
        })
        setVisibleLayers(all)
      } else {
        setVisibleLayers([])
      }
    },
    [layers]
  )

  // ── Processed layers (visibility + group filter) ──────────────────────────
  const processedLayers = useMemo(() => {
    return layers
      .map((layer) => {
        const vc = layer.visualConfig
        const ruleField = vc?.rules?.[0]?.field
        const groupByColumn = vc?.groupByColumn || ruleField
        let isVisible = false
        let activeValues: string[] = []

        if (groupByColumn) {
          activeValues = visibleLayers
            .filter((s) => s.startsWith(`${layer.slug}__`))
            .map((s) => s.replace(`${layer.slug}__`, ''))
          if (activeValues.length > 0) isVisible = true
        } else {
          isVisible = visibleLayers.includes(layer.slug)
        }

        if (!isVisible || !layer.data?.features?.length) return null

        let displayData = layer.data
        if (groupByColumn && activeValues.length > 0) {
          displayData = {
            ...displayData,
            features: displayData.features.filter((f) =>
              activeValues.includes(f.properties?.[groupByColumn] as string)
            ),
          }
        }

        return {
          layer,
          displayData,
          componentKey: `${layer.slug}-${displayData.features.length}-${dataVersion}`,
        }
      })
      .filter(
        (item): item is NonNullable<typeof item> => item !== null
      )
  }, [layers, visibleLayers, dataVersion])

  // ── interactiveLayerIds for click/hover ───────────────────────────────────
  const interactiveLayerIds = useMemo(
    () =>
      processedLayers.flatMap(({ layer }) => [
        `${layer.slug}-fill`,
        `${layer.slug}-circle`,
        `${layer.slug}-line`,
      ]),
    [processedLayers]
  )

  // ── Map event handlers ────────────────────────────────────────────────────
  const handleMapClick = useCallback(
    (e: any) => {
      // Coordinate inspector mode
      if (coordInspectorActive) {
        setInspectedCoord({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        return
      }

      // Measure mode
      if (measureMode && measureDrawing) {
        setMeasurePoints((prev) => [
          ...prev,
          [e.lngLat.lng, e.lngLat.lat],
        ])
        return
      }

      // Feature click → modal
      if (!e.features?.length) return
      const feature = e.features[0]
      const slug = feature.layer.id.replace(/-(fill|circle|line)$/, '')
      const props = feature.properties ?? {}

      if (slug === 'acoes') setSelectedAcao(props)
      else setSelectedAcao(null)

      openModal('', <FeatureDetails layerType={slug} properties={props} />)
    },
    [coordInspectorActive, measureMode, measureDrawing, openModal]
  )

  const handleMouseMove = useCallback(
    (e: any) => {
      if (measureMode && measureDrawing) {
        setMeasureCursorPos([e.lngLat.lng, e.lngLat.lat])
        setHoveredFeature(null)
        setHoverCoords(null)
        return
      }

      if (!e.features?.length) {
        setHoveredFeature(null)
        setHoverCoords(null)
        return
      }

      const feature = e.features[0]
      const slug = feature.layer.id.replace(/-(fill|circle|line)$/, '')
      if (EXCLUDED_HOVER.some((ex) => slug.includes(ex))) {
        setHoveredFeature(null)
        setHoverCoords(null)
        return
      }

      setHoveredFeature({ ...feature.properties, _slug: slug })
      setHoverCoords([e.lngLat.lng, e.lngLat.lat])
    },
    [measureMode, measureDrawing]
  )

  const handleContextMenu = useCallback(() => {
    if (measureMode && measureDrawing) {
      setMeasureDrawing(false)
      setMeasureCursorPos(null)
    }
  }, [measureMode, measureDrawing])

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursor = useMemo(() => {
    if (coordInspectorActive) return 'crosshair'
    if (measureMode && measureDrawing) return 'crosshair'
    if (hoveredFeature) return 'pointer'
    return 'grab'
  }, [coordInspectorActive, measureMode, measureDrawing, hoveredFeature])

  // ── Measure calculations ──────────────────────────────────────────────────
  const measureDistance = useMemo(
    () =>
      measurePoints.reduce((acc, pt, i) => {
        if (i === 0) return 0
        return acc + haversine(measurePoints[i - 1], pt)
      }, 0) +
      (measureDrawing && measureCursorPos && measurePoints.length > 0
        ? haversine(measurePoints[measurePoints.length - 1], measureCursorPos)
        : 0),
    [measurePoints, measureCursorPos, measureDrawing]
  )

  const measureArea = useMemo(() => {
    if (measureMode !== 'area') return 0
    const pts = [
      ...measurePoints,
      ...(measureCursorPos && measureDrawing ? [measureCursorPos] : []),
    ]
    return sphericalArea(pts)
  }, [measurePoints, measureCursorPos, measureDrawing, measureMode])

  // ── Measure GeoJSON sources ───────────────────────────────────────────────
  const measureLineGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features:
        measureMode === 'distance' && measurePoints.length > 0
          ? [
              {
                type: 'Feature' as const,
                geometry: {
                  type: 'LineString' as const,
                  coordinates: [
                    ...measurePoints,
                    ...(measureCursorPos && measureDrawing
                      ? [measureCursorPos]
                      : []),
                  ],
                },
                properties: {},
              },
            ]
          : [],
    }),
    [measureMode, measurePoints, measureCursorPos, measureDrawing]
  )

  const measureAreaGeoJSON = useMemo(() => {
    if (measureMode !== 'area' || measurePoints.length < 2) {
      return { type: 'FeatureCollection' as const, features: [] }
    }
    const ring = [
      ...measurePoints,
      ...(measureCursorPos && measureDrawing ? [measureCursorPos] : []),
      measurePoints[0],
    ]
    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          geometry: { type: 'Polygon' as const, coordinates: [ring] },
          properties: {},
        },
      ],
    }
  }, [measureMode, measurePoints, measureCursorPos, measureDrawing])

  const measureVerticesGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: measurePoints.map((p) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: p },
        properties: {},
      })),
    }),
    [measurePoints]
  )

  // ── Fauna GeoJSON ─────────────────────────────────────────────────────────
  const faunaGeoJSON = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: faunaData.map(([lat, lng, weight]) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: { weight },
      })),
    }),
    [faunaData]
  )

  // ── Measure control handlers ───────────────────────────────────────────────
  const handleToggleMeasureMode = useCallback(
    (mode: 'distance' | 'area') => {
      if (measureMode === mode) {
        setMeasureMode(null)
        setMeasurePoints([])
        setMeasureCursorPos(null)
        setMeasureDrawing(false)
      } else {
        setMeasureMode(mode)
        setMeasurePoints([])
        setMeasureCursorPos(null)
        setMeasureDrawing(true)
      }
    },
    [measureMode]
  )

  const handleClearMeasure = useCallback(() => {
    setMeasurePoints([])
    setMeasureCursorPos(null)
    setMeasureDrawing(true)
  }, [])

  // ── LayerManager options ───────────────────────────────────────────────────
  const layerManagerOptions = useMemo((): LayerManagerOption[] => {
    return layers.map((layer) => {
      const { legendType, iconName, color: baseColor, fillColor: baseFill } =
        getLayerLegendInfo(layer.visualConfig)
      const config = layer.visualConfig
      const firstRule = config?.rules?.[0]
      const groupByColumn = config?.groupByColumn || firstRule?.field

      if (groupByColumn) {
        let groups = layer.groups || []
        if (groups.length === 0 && firstRule?.values) {
          groups = Object.entries(firstRule.values).map(([key, value]) => {
            const style = typeof value === 'string' ? {} : (value as any)
            return {
              id: key,
              label: key,
              color: style.color || baseColor,
              icon: style.iconName || iconName,
            }
          })
        }
        if (groups.length > 0) {
          return {
            id: String(layer.id),
            label: layer.name,
            slug: layer.slug,
            color: baseColor,
            icon: iconName,
            legendType,
            fillColor: baseFill,
            category: layer.visualConfig?.category,
            subOptions: groups.map((group) => ({
              id: `${layer.slug}__${group.id}`,
              label: group.label,
              slug: `${layer.slug}__${group.id}`,
              color: group.color || baseColor,
              icon: group.icon || iconName,
              legendType,
              fillColor: baseFill,
              category: layer.visualConfig?.category,
            })),
          }
        }
      }

      return {
        id: String(layer.id),
        label: layer.name,
        slug: layer.slug,
        color: baseColor,
        icon: iconName,
        legendType,
        fillColor: baseFill,
        category: layer.visualConfig?.category,
      }
    })
  }, [layers])

  // ── Hover popup content ───────────────────────────────────────────────────
  const hoveredLayerConfig = useMemo(() => {
    if (!hoveredFeature) return null
    return layers.find((l) => l.slug === hoveredFeature._slug) ?? null
  }, [hoveredFeature, layers])

  const hoverPopupFields = useMemo(() => {
    if (!hoveredLayerConfig) return null
    return (
      hoveredLayerConfig.visualConfig?.popupFields ||
      hoveredLayerConfig.schemaConfig?.fields ||
      null
    )
  }, [hoveredLayerConfig])

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
        <span className="text-red-500">Erro ao carregar o mapa: {error}</span>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-screen relative z-10">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={BASEMAPS[basemap]}
        cursor={cursor}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
        interactiveLayerIds={interactiveLayerIds}
      >
        <NavigationControl position="top-right" />

        {/* ── Data layers ── */}
        {processedLayers.flatMap(({ layer, displayData }) => {
          const vc = layer.visualConfig
          const mlConfig = (vc as any)?.maplibre
          const style = vc?.baseStyle ?? vc
          const firstFeature = displayData.features[0] as any
          const layerType: MapLibreLayerType =
            (mlConfig?.type as MapLibreLayerType) ??
            resolveLayerType(style, firstFeature)

          const source = (
            <Source
              key={`src-${layer.slug}`}
              id={layer.slug}
              type="geojson"
              data={displayData as any}
            />
          )

          if (layerType === 'fill') {
            const paint = mlConfig?.paint ?? toFillPaint(style)
            return [
              source,
              <Layer
                key={`${layer.slug}-fill`}
                id={`${layer.slug}-fill`}
                source={layer.slug}
                type="fill"
                paint={paint as any}
              />,
              ...(!mlConfig
                ? [
                    <Layer
                      key={`${layer.slug}-outline`}
                      id={`${layer.slug}-outline`}
                      source={layer.slug}
                      type="line"
                      paint={{
                        'line-color': style?.color ?? '#3b82f6',
                        'line-width': style?.weight ?? 1,
                        'line-opacity': style?.opacity ?? 0.8,
                      }}
                    />,
                  ]
                : []),
            ]
          }

          if (layerType === 'circle') {
            const paint = mlConfig?.paint ?? toCirclePaint(style)
            return [
              source,
              <Layer
                key={`${layer.slug}-circle`}
                id={`${layer.slug}-circle`}
                source={layer.slug}
                type="circle"
                paint={paint as any}
              />,
            ]
          }

          const paint = mlConfig?.paint ?? toLinePaint(style)
          return [
            source,
            <Layer
              key={`${layer.slug}-line`}
              id={`${layer.slug}-line`}
              source={layer.slug}
              type="line"
              paint={paint as any}
            />,
          ]
        })}

        {/* ── Shapefile preview ── */}
        {previewGeoJSON && (
          <>
            <Source id="preview" type="geojson" data={previewGeoJSON.data} />
            <Layer
              id="preview-fill"
              source="preview"
              type="fill"
              paint={{
                'fill-color': previewGeoJSON.color,
                'fill-opacity': 0.2,
              }}
            />
            <Layer
              id="preview-line"
              source="preview"
              type="line"
              paint={{
                'line-color': previewGeoJSON.color,
                'line-width': 2,
              }}
            />
          </>
        )}

        {/* ── Fauna layers ── */}
        {faunaData.length > 0 && (
          <Source id="fauna" type="geojson" data={faunaGeoJSON as any} />
        )}
        {faunaHeatmapActive && faunaData.length > 0 && (
          <Layer
            id="fauna-heatmap"
            source="fauna"
            type="heatmap"
            paint={{
              'heatmap-weight': ['get', 'weight'],
              'heatmap-intensity': 1,
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0,0,255,0)',
                0.4, 'blue',
                0.6, 'cyan',
                0.7, 'lime',
                0.8, 'yellow',
                1, 'red',
              ],
              'heatmap-radius': 40,
              'heatmap-opacity': 0.8,
            }}
          />
        )}
        {faunaLocationsActive && faunaData.length > 0 && (
          <Layer
            id="fauna-locations"
            source="fauna"
            type="circle"
            paint={{
              'circle-color': '#f97316',
              'circle-radius': 6,
              'circle-opacity': 0.7,
              'circle-stroke-color': '#ea580c',
              'circle-stroke-width': 2,
            }}
          />
        )}

        {/* ── Measure layers ── */}
        {measureMode && (
          <>
            <Source
              id="measure-line"
              type="geojson"
              data={measureLineGeoJSON as any}
            />
            <Layer
              id="measure-line-layer"
              source="measure-line"
              type="line"
              paint={{
                'line-color': '#ec4899',
                'line-width': 3,
                'line-opacity': 0.8,
              }}
            />

            <Source
              id="measure-area"
              type="geojson"
              data={measureAreaGeoJSON as any}
            />
            <Layer
              id="measure-area-fill"
              source="measure-area"
              type="fill"
              paint={{ 'fill-color': '#3b82f6', 'fill-opacity': 0.2 }}
            />
            <Layer
              id="measure-area-line"
              source="measure-area"
              type="line"
              paint={{ 'line-color': '#3b82f6', 'line-width': 2 }}
            />

            <Source
              id="measure-vertices"
              type="geojson"
              data={measureVerticesGeoJSON as any}
            />
            <Layer
              id="measure-vertices-layer"
              source="measure-vertices"
              type="circle"
              paint={{
                'circle-color':
                  measureMode === 'area' ? '#3b82f6' : '#ec4899',
                'circle-radius': 5,
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 2,
              }}
            />
          </>
        )}

        {/* ── Coordinate inspector marker ── */}
        {coordInspectorActive && inspectedCoord && (
          <Marker
            longitude={inspectedCoord.lng}
            latitude={inspectedCoord.lat}
            anchor="center"
          >
            <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-md" />
          </Marker>
        )}

        {/* ── Hover tooltip ── */}
        {hoveredFeature && hoverCoords && hoverPopupFields?.length ? (
          <Popup
            longitude={hoverCoords[0]}
            latitude={hoverCoords[1]}
            closeButton={false}
            offset={[0, -8] as any}
            anchor="bottom"
          >
            <div className="p-1 min-w-[150px]">
              <h3 className="font-bold mb-1 text-xs border-b pb-1">
                {hoveredLayerConfig?.name}
              </h3>
              <div className="space-y-0.5 text-[10px]">
                {hoverPopupFields.map((field) => (
                  <div key={field.key} className="flex justify-between gap-4">
                    <span className="text-slate-500">{field.label}:</span>
                    <span className="font-medium text-slate-800">
                      {hoveredFeature[field.key] ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        ) : null}
      </Map>

      {/* ── Controls overlay ─────────────────────────────────────────────── */}

      {/* Basemap switcher */}
      <div className="absolute top-4 right-14 z-[400] flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-md border border-gray-200">
        <Button
          variant={basemap === 'streets' ? 'default' : 'ghost'}
          size="sm"
          className={`h-7 px-2 text-xs ${basemap === 'streets' ? 'bg-brand-primary text-white' : 'text-slate-600'}`}
          onClick={() => setBasemap('streets')}
          title="Mapa de Ruas"
        >
          Ruas
        </Button>
        <Button
          variant={basemap === 'dark' ? 'default' : 'ghost'}
          size="sm"
          className={`h-7 px-2 text-xs ${basemap === 'dark' ? 'bg-brand-primary text-white' : 'text-slate-600'}`}
          onClick={() => setBasemap('dark')}
          title="Tema Escuro"
        >
          Dark
        </Button>
      </div>

      {/* Left panel: filters */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-4">
        <DateFilterControl onDateChange={setDateFilter} />
        <PropertyFilterControl onFilterChange={setAreaFilter} />
        <MaplibreFaunaHeatmapControl
          isHeatmapActive={faunaHeatmapActive}
          isLocationsActive={faunaLocationsActive}
          isLoading={faunaLoading}
          hasFetched={faunaFetched}
          dataCount={faunaData.length}
          onToggleHeatmap={setFaunaHeatmapActive}
          onToggleLocations={setFaunaLocationsActive}
        />
      </div>

      {/* Reload button */}
      <div className="absolute top-44 right-4 z-[400]">
        <Button
          variant="outline"
          size="icon"
          onClick={fetchLayers}
          className="bg-white hover:bg-gray-100 shadow-md text-black border-input"
          title="Atualizar dados"
        >
          <LucideIcons.RefreshCw
            className={`h-4 w-4 ${loadingLayers ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Measure control */}
      <MaplibreMeasureControl
        mode={measureMode}
        isDrawing={measureDrawing}
        hasPoints={measurePoints.length > 0}
        distance={measureDistance}
        area={measureArea}
        onToggleMode={handleToggleMeasureMode}
        onClear={handleClearMeasure}
      />

      {/* Coordinate inspector */}
      <MaplibreCoordinateInspector
        isActive={coordInspectorActive}
        onToggle={() => {
          setCoordInspectorActive((v) => !v)
          if (coordInspectorActive) setInspectedCoord(null)
        }}
        coordinate={inspectedCoord}
      />

      {/* Snapshot */}
      <MaplibreSnapshotControl
        activeLayers={visibleLayers}
        mapRef={mapRef}
      />

      {/* Shapefile uploader */}
      <ShapefileUploader
        onPreview={(data, color) => setPreviewGeoJSON({ data, color })}
        onClearPreview={() => setPreviewGeoJSON(null)}
        onSaveSuccess={fetchLayers}
      />

      {/* Bottom-left: LayerManager */}
      <div className="absolute bottom-4 left-4 z-[1000]">
        <LayerManager
          title="Camadas"
          options={layerManagerOptions}
          activeLayers={visibleLayers}
          onLayerToggle={handleLayerToggle}
          onToggleAll={handleToggleAll}
          onGroupToggle={handleGroupToggle}
        />
      </div>

      {/* Loading overlay */}
      {loadingLayers && (
        <div className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-brand-dark border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            <span className="text-slate-200 text-sm font-medium">
              Atualizando dados...
            </span>
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        showEdit={isAdmin && !!selectedAcao}
        onEdit={() => setIsEditOpen(true)}
      >
        {modalData.content}
      </Modal>

      <EditAcaoModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        acao={selectedAcao}
        onSave={async (data, files) => {
          const form = new FormData()
          Object.entries(data).forEach(([k, v]) => form.append(k, String(v)))
          files.forEach((f) => form.append('files', f))
          await fetch(`/api/acoes/${data.id}`, { method: 'PUT', body: form })
          await fetchLayers()
          setIsEditOpen(false)
          closeModal()
        }}
      />
    </div>
  )
}
