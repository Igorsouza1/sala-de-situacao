'use client'

import Map, {
  Source,
  Layer,
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
import type { LayerResponseDTO, MapFeatureCollection } from '@/types/map-dto'
import {
  resolveLayerType,
  toFillPaint,
  toCirclePaint,
  toLinePaint,
  type MapLibreLayerType,
} from './helpers/maplibre-layer'
import type { LayerManagerOption, LayerStatus } from './LayerManager'
import { EditModeButton, LayersPanel, RefreshButton } from './LayersPanel'
import { Notice, type NoticeData } from './Notice'
import { Reveal } from '@/components/ui/collapse'
import { LayerEditor } from './LayerEditor'
import { GroupIconEditor } from './GroupIconEditor'
import { applyEdit, readEdit, ruleIcon, type LayerEdit } from '@/lib/layer-style'
import { FiltersPanel } from './FiltersPanel'
import { activeFilterCount, datesFromIntent, intentFromDates } from './helpers/filters'
import {
  clearBasemap,
  clearRegionPrefs,
  isInsideBounds,
  readBasemap,
  readRegionPrefs,
  saveBasemap,
  saveRegionPrefs,
} from './helpers/map-prefs'
import {
  AREA_SENSITIVE_SLUGS,
  DATE_SENSITIVE_SLUGS,
  filterNoteFor,
  initialVisibleSlugs,
  isDefaultOnSlug,
  isLayerOn,
  restoreVisibleSlugs,
  type FilterNote,
} from './helpers/layers'
import { Modal } from './Modal'
import { EditAcaoModal } from './EditAcaoModal'
import { FeatureDetails } from './feature-details'
import { ShapefileUploader } from './ShapefileUploader'
import { MaplibreSnapshotControl } from './MaplibreSnapshotControl'
import { MaplibreIconMarkers } from './MaplibreIconMarkers'
import { AcaoHoverCard } from './AcaoHoverCard'
import { ToolFeedback } from './ToolFeedback'
import { ToolMenu } from './ToolMenu'
import { isMeasureTool, type Tool } from './helpers/tools'
import { useMapContext } from '@/context/GeoDataContext'
import { useUserRole } from '@/hooks/useUserRole'
import { getLayerLegendInfo, resolveFeatureStyle } from './helpers/map-visuals'
import { Button } from '@/components/ui/button'
import { CameraControls } from './CameraControls'
import { DockPanelButton, DockDivider, MapDock } from './MapDock'
import { PrismCursor } from './PrismCursor'
import {
  BASEMAP_MAX_ZOOM,
  DEFAULT_BASEMAP,
  DEM_MAX_ZOOM,
  DEM_TILES,
  HILLSHADE_BASEMAPS,
  STATIC_STYLES,
  blankStyle,
  hillshadePaint,
  loadMineralStyle,
  readMapTokens,
  tintMineral,
  type BasemapKey,
} from './helpers/basemaps'
import {
  TERRAIN_EXAGGERATION,
  cameraFor,
  clearMode,
  modeFromPitch,
  readSavedMode,
  saveMode,
  type ViewMode,
} from './helpers/view-mode'

// ── Module-level cache — persists across SPA navigation within the same tab ──
// Cleared only on hard reload. Shared by all MapLibreMap mounts.
const _cache: {
  layers: LayerResponseDTO[]
  data: Record<string, MapFeatureCollection>
  dateFilterKey: string
  areaFilterKey: string
} = { layers: [], data: {}, dateFilterKey: '', areaFilterKey: '' }

// Detecta se um layer deve ser renderizado como HTML markers com ícones Lucide.
// Condição 1: visual_config.maplibre.type === 'icon-marker'  (flag explícita MapLibre)
// Condição 2: visual_config.baseStyle.type === 'icon'         (compat com config Leaflet existente)
const isIconLayer = (vc: LayerResponseDTO['visualConfig']): boolean => {
  if ((vc as any)?.maplibre?.type === 'icon-marker') return true
  const base = (vc?.baseStyle || vc) as any
  return base?.type === 'icon'
}

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
  /** Override de região — passado via ?regiao_id= na URL (admin/superadmin) */
  regiaoId?: number
}

// Layers excluded from hover tooltip
const EXCLUDED_HOVER = ['propriedades', 'banhado']

// A Fauna entra no painel Camadas como camada, mas não vem do catálogo: tem busca e estado próprios
const FAUNA_HEATMAP = 'fauna__heatmap'
const FAUNA_LOCATIONS = 'fauna__locations'

export default function MapLibreMap({
  center = [-21.327773, -56.694734],
  zoom = 11,
  regiaoId,
}: MapLibreMapProps) {
  // Preferências da pessoa para esta região (DESIGN.md 13.2): lidas uma vez ao abrir; gravadas a cada ação dela, nunca por conta própria
  const [saved] = useState(() => readRegionPrefs(regiaoId))

  // ── Edição de camada (DESIGN.md 13.3): o estado fica aqui em cima porque o mapa e a busca de dados também o leem ──
  // O rascunho vale só na tela até a pessoa salvar: o mapa e a lista desenham a camada com ele (pré-visualização ao vivo).
  const [draft, setDraft] = useState<{ slug: string; /** a área em edição (ex.: um eixo de Ações), quando o que se edita é o ícone dela */ groupKey?: string; initial: LayerEdit; edit: LayerEdit } | null>(null)
  const [savingLayer, setSavingLayer] = useState(false)
  const [saveLayerError, setSaveLayerError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false) // "Editar": a lista vira "escolha a camada"
  const [notice, setNotice] = useState<NoticeData | null>(null)
  const [flashSlug, setFlashSlug] = useState<string | null>(null) // a linha da camada recém-editada pisca em verde claro (8.4)
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flash = useCallback((slug: string) => {
    setFlashSlug(slug)
    if (flashTimer.current) clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlashSlug(null), 2000)
  }, [])

  // ── Core layer state (initialized from module cache for instant return nav) ──
  const [layers, setLayers] = useState<LayerResponseDTO[]>(() => _cache.layers)
  const [layerData, setLayerData] = useState<Record<string, MapFeatureCollection>>(() => ({ ..._cache.data }))
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])
  const [loadingLayers, setLoadingLayers] = useState(_cache.layers.length === 0)
  const [error, setError] = useState<string | null>(null)
  const [failedLayers, setFailedLayers] = useState<string[]>([])
  const [areaFilter, setAreaFilter] = useState<{
    minArea?: number
    maxArea?: number
  }>(() => saved.area ?? {})
  const fetchingRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  // ── Debounced batch flush for layer data (groups parallel fetches into 1 render) ─
  const pendingBatch = useRef<Record<string, MapFeatureCollection>>({})
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBatch = useCallback(() => {
    const updates = pendingBatch.current
    if (!Object.keys(updates).length) return
    pendingBatch.current = {}
    batchTimer.current = null
    setLayerData((prev) => ({ ...prev, ...updates }))
  }, [])

  const enqueueLayerData = useCallback((slug: string, data: MapFeatureCollection) => {
    pendingBatch.current[slug] = data
    _cache.data[slug] = data
    if (batchTimer.current) clearTimeout(batchTimer.current)
    batchTimer.current = setTimeout(flushBatch, 80)
  }, [flushBatch])

  // ── Context / auth ──────────────────────────────────────────────────────
  const { modalData, openModal, closeModal, dateFilter, setDateFilter } =
    useMapContext()
  const { isAdmin } = useUserRole()
  const [selectedAcao, setSelectedAcao] = useState<any | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Período salvo: o contexto abre em "Este ano"; se a pessoa deixou outra escolha, ela volta a valer (recalculada para hoje)
  useEffect(() => {
    if (saved.date) {
      const [s, e] = datesFromIntent(saved.date, new Date())
      setDateFilter(s, e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDateChange = useCallback(
    (start: Date | null, end: Date | null) => {
      setDateFilter(start, end)
      saveRegionPrefs(regiaoId, { date: intentFromDates(start, end, new Date()) })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regiaoId],
  )

  const handleAreaChange = useCallback(
    (filter: { minArea?: number; maxArea?: number }) => {
      setAreaFilter(filter)
      saveRegionPrefs(regiaoId, { area: filter })
    },
    [regiaoId],
  )

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
  const [hoverCoords, setHoverCoords] = useState<[number, number] | null>(null)

  // ── Coordinate inspector ────────────────────────────────────────────────
  const [activeTool, setActiveTool] = useState<Tool | null>(null)
  const coordInspectorActive = activeTool === 'coords'
  const propertyInfoActive = activeTool === 'property'
  const [inspectedCoord, setInspectedCoord] = useState<{
    lat: number
    lng: number
  } | null>(null)

  // ── Measure control ─────────────────────────────────────────────────────
  const measureMode: MeasureMode = activeTool === 'measure-distance' ? 'distance' : activeTool === 'measure-area' ? 'area' : null
  const [measurePoints, setMeasurePoints] = useState<LngLat[]>([])
  const [measureDrawing, setMeasureDrawing] = useState(false)
  const [measureCursorPos, setMeasureCursorPos] = useState<LngLat | null>(null)

  // ── Fauna heatmap ───────────────────────────────────────────────────────
  const [faunaData, setFaunaData] = useState<[number, number, number][]>([])
  const [faunaHeatmapActive, setFaunaHeatmapActive] = useState(() => saved.fauna?.heatmap ?? false)
  const [faunaLocationsActive, setFaunaLocationsActive] = useState(() => saved.fauna?.locations ?? false)
  const [faunaLoading, setFaunaLoading] = useState(false)
  const [faunaFetched, setFaunaFetched] = useState(false)
  const [faunaFailed, setFaunaFailed] = useState(false)

  // ── Property info mode ──────────────────────────────────────────────────
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null)
  const [hoveredPropertyBasic, setHoveredPropertyBasic] = useState<{
    nome?: string
    cod_imovel?: string
    municipio?: string
    num_area?: number
  } | null>(null)

  // ── Basemap ─────────────────────────────────────────────────────────────
  const [basemap, setBasemap] = useState<BasemapKey>(() => readBasemap() ?? DEFAULT_BASEMAP)
  const [mineralRaw, setMineralRaw] = useState<any>(null)
  const [mineralFailed, setMineralFailed] = useState(false)
  const tokens = useMemo(() => readMapTokens(), [])

  // Mineral indisponível: o mapa mostra Ruas e o seletor avisa; só volta quando o usuário escolher o Mineral de novo.
  const shownBasemap: BasemapKey = basemap === 'mineral' && mineralFailed ? 'streets' : basemap

  useEffect(() => {
    if (basemap !== 'mineral' || mineralRaw || mineralFailed) return
    let alive = true
    loadMineralStyle()
      .then((style) => alive && setMineralRaw(style))
      .catch(() => alive && setMineralFailed(true))
    return () => { alive = false }
  }, [basemap, mineralRaw, mineralFailed])

  const handleBasemapChange = useCallback((key: BasemapKey) => {
    setBasemap(key)
    saveBasemap(key)
    if (key === 'mineral') setMineralFailed(false)
  }, [])

  const mapStyle = useMemo(() => {
    if (shownBasemap !== 'mineral') return STATIC_STYLES[shownBasemap]
    return mineralRaw ? tintMineral(mineralRaw, tokens) : blankStyle(tokens.bg)
  }, [shownBasemap, mineralRaw, tokens])

  // ── Modo 2D/3D (salvo no navegador) ─────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>(readSavedMode)
  // O relevo só desliga quando a câmera termina de achatar: nada some do nada (DESIGN.md 8.4).
  const [terrainOn, setTerrainOn] = useState(() => viewMode === '3d')
  const viewModeRef = useRef(viewMode)
  const autoMoveRef = useRef(false) // a animação de abertura não grava a preferência

  // ── Map ref & region bounds ─────────────────────────────────────────────
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const fitBoundsDone = useRef(false)
  const [regionBounds, setRegionBounds] = useState<{
    center: [number, number]
    bbox: [number, number, number, number]
  } | null>(null)

  // ── Fetch catalog metadata (lightweight, no GeoJSON) ────────────────────
  // `fresh`: o Atualizar ignora o cache do navegador (a API guarda o catálogo por 2 minutos), senão traria a versão de antes da edição
  const fetchCatalog = useCallback(async (fresh = false) => {
    if (_cache.layers.length === 0) setLoadingLayers(true)
    setError(null)
    try {
      const catalogUrl = regiaoId
        ? `/api/map/layers?metadataOnly=true&regiao_id=${regiaoId}`
        : '/api/map/layers?metadataOnly=true'
      const response = await fetch(catalogUrl, fresh ? { cache: 'reload' } : undefined)
      if (response.ok) {
        const data: LayerResponseDTO[] = await response.json()
        const sorted = data.sort((a, b) => (a.ordering || 0) - (b.ordering || 0))
        _cache.layers = sorted
        setLayers(sorted)
      } else {
        setError('Falha ao carregar catálogo de camadas')
      }
    } catch {
      setError('Erro ao conectar com servidor')
    } finally {
      setLoadingLayers(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regiaoId])

  // ── Fetch single layer GeoJSON (called lazily on toggle) ─────────────────
  const fetchLayerData = useCallback(async (slug: string) => {
    if (fetchingRef.current.has(slug)) return
    fetchingRef.current.add(slug)
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

      if (regiaoId) params.append('regiao_id', String(regiaoId))
      const response = await fetch(`/api/map/layers/${slug}?${params.toString()}`)
      if (response.ok) {
        const dto: LayerResponseDTO = await response.json()
        enqueueLayerData(slug, dto.data)
        setFailedLayers((prev) => prev.filter((s) => s !== slug))
      } else {
        setFailedLayers((prev) => (prev.includes(slug) ? prev : [...prev, slug]))
      }
    } catch (e) {
      console.error(`Failed to load layer data for ${slug}:`, e)
      setFailedLayers((prev) => (prev.includes(slug) ? prev : [...prev, slug]))
    } finally {
      fetchingRef.current.delete(slug)
    }
  }, [
    enqueueLayerData,
    regiaoId,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dateFilter.startDate?.toISOString(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dateFilter.endDate?.toISOString(),
    areaFilter.minArea,
    areaFilter.maxArea,
  ])

  // Limpa cache do módulo quando região muda (navegação entre regiões no admin)
  useEffect(() => {
    _cache.layers = []
    _cache.data = {}
    _cache.dateFilterKey = ''
    _cache.areaFilterKey = ''
    fitBoundsDone.current = false
    initializedRef.current = false
    setLayers([])
    setLayerData({})
    setVisibleLayers([])
    setLoadingLayers(true)
  }, [regiaoId])

  // Boot: fetch catalog once (após limpeza de cache acima)
  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // ── Fetch region bounds for initial map positioning ──────────────────────
  useEffect(() => {
    const url = regiaoId ? `/api/map/region?regiao_id=${regiaoId}` : '/api/map/region'
    fetch(url)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setRegionBounds(data) })
      .catch(() => { /* silent: falls back to default center */ })
  }, [regiaoId])

  // Fit map to region once both map and region data are ready (fires once)
  useEffect(() => {
    if (fitBoundsDone.current || !mapLoaded || !regionBounds || !mapRef.current) return
    fitBoundsDone.current = true
    // Abre onde a pessoa deixou, se ainda for dentro da região (a câmera já nasceu ali, em initialViewState): sem movimento.
    if (saved.camera && isInsideBounds(saved.camera, regionBounds.bbox)) return
    const [minLng, minLat, maxLng, maxLat] = regionBounds.bbox
    // um movimento só: enquadra a região e inclina até o modo salvo (2D na primeira visita)
    autoMoveRef.current = true
    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 60, duration: 1200, linear: true, ...cameraFor(viewMode) },
    )
  // viewMode só vale na abertura; trocar o modo depois não reenquadra a região
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, regionBounds])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    viewModeRef.current = mode
    setViewMode(mode)
    saveMode(mode)
    if (mode === '3d') setTerrainOn(true)
    mapRef.current?.easeTo({ ...cameraFor(mode), duration: 1000 })
  }, [])

  // O segmento segue a câmera: inclinar com o mouse ou clicar na bússola também troca 2D/3D (e salva).
  const handleMoveEnd = useCallback((e: { viewState: { pitch: number; longitude: number; latitude: number; zoom: number } }) => {
    if (autoMoveRef.current) { autoMoveRef.current = false; return } // o enquadramento automático da abertura não é escolha da pessoa
    saveRegionPrefs(regiaoId, { camera: { lng: e.viewState.longitude, lat: e.viewState.latitude, zoom: e.viewState.zoom } })
    const next = modeFromPitch(e.viewState.pitch)
    if (next !== viewModeRef.current) { viewModeRef.current = next; setViewMode(next); saveMode(next) }
    setTerrainOn(next === '3d')
  }, [regiaoId])

  // "Enquadrar a região": o mesmo movimento da abertura, a qualquer hora (a câmera nova fica salva, porque foi escolha da pessoa)
  const handleFitRegion = useCallback(() => {
    if (!regionBounds || !mapRef.current) return
    const [minLng, minLat, maxLng, maxLat] = regionBounds.bbox
    mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 1200, linear: true, ...cameraFor(viewModeRef.current) })
  }, [regionBounds])

  // Initialize all layers as visible once catalog arrives
  useEffect(() => {
    if (!initializedRef.current && layers.length > 0) {
      setVisibleLayers(restoreVisibleSlugs(layers, readRegionPrefs(regiaoId).layers))
      initializedRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers])

  // Date filter: invalida apenas camadas date-sensitive (acoes, raw_firms, desmatamento).
  // Camadas estáticas (propriedades, rio, banhado, estradas…) permanecem em cache.
  useEffect(() => {
    const newKey = [
      dateFilter.startDate?.toISOString() ?? '',
      dateFilter.endDate?.toISOString() ?? '',
    ].join('|')
    if (_cache.dateFilterKey === newKey) return
    _cache.dateFilterKey = newKey

    const slugsToClear = layers
      .filter(l => l.visualConfig?.dateFilter === true || DATE_SENSITIVE_SLUGS.has(l.slug))
      .map(l => l.slug)

    slugsToClear.forEach(s => {
      delete _cache.data[s]
      delete pendingBatch.current[s]
      fetchingRef.current.delete(s)
    })
    if (batchTimer.current) { clearTimeout(batchTimer.current); batchTimer.current = null }
    if (slugsToClear.length > 0) {
      setLayerData(prev => {
        const next = { ...prev }
        slugsToClear.forEach(s => delete next[s])
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.startDate?.toISOString(), dateFilter.endDate?.toISOString()])

  // Area filter: invalida apenas camadas area-sensitive (propriedades).
  useEffect(() => {
    const newKey = [String(areaFilter.minArea ?? ''), String(areaFilter.maxArea ?? '')].join('|')
    if (_cache.areaFilterKey === newKey) return
    _cache.areaFilterKey = newKey

    const slugsToClear = layers.filter(l => AREA_SENSITIVE_SLUGS.has(l.slug)).map(l => l.slug)

    slugsToClear.forEach(s => {
      delete _cache.data[s]
      delete pendingBatch.current[s]
      fetchingRef.current.delete(s)
    })
    if (batchTimer.current) { clearTimeout(batchTimer.current); batchTimer.current = null }
    if (slugsToClear.length > 0) {
      setLayerData(prev => {
        const next = { ...prev }
        slugsToClear.forEach(s => delete next[s])
        return next
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaFilter.minArea, areaFilter.maxArea])

  // Lazy load: fetch data for visible parent slugs not yet in cache
  useEffect(() => {
    const parentSlugs = new Set<string>()
    visibleLayers.forEach((sv) => {
      const slug = sv.includes('__') ? sv.split('__')[0] : sv
      parentSlugs.add(slug)
    })
    if (draft) parentSlugs.add(draft.slug)
    parentSlugs.forEach((slug) => {
      if (!layerData[slug] && !fetchingRef.current.has(slug)) {
        fetchLayerData(slug)
      }
    })
  // layerData intentionally in deps: after cache clear, re-fetches visible slugs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleLayers, layerData, fetchLayerData, draft])

  // ── Fauna data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (
      (faunaHeatmapActive || faunaLocationsActive) &&
      !faunaFetched &&
      !faunaLoading &&
      !faunaFailed
    ) {
      setFaunaLoading(true)
      fetch('/api/map/heatmap/fauna-exotica')
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            setFaunaData(json.data)
            setFaunaFetched(true)
          } else {
            setFaunaFailed(true)
          }
        })
        .catch(() => setFaunaFailed(true))
        .finally(() => setFaunaLoading(false))
    }
  }, [faunaHeatmapActive, faunaLocationsActive, faunaFetched, faunaLoading, faunaFailed])

  // Clear property hover state when info mode is deactivated
  useEffect(() => {
    if (!propertyInfoActive) {
      setHoveredPropertyId(null)
      setHoveredPropertyBasic(null)
    }
  }, [propertyInfoActive])

  // Só uma ferramenta ativa por vez: escolher outra (ou null) desliga a anterior e limpa o que ela deixou
  const selectTool = useCallback((tool: Tool | null) => {
    setActiveTool(tool)
    setMeasurePoints([])
    setMeasureCursorPos(null)
    setMeasureDrawing(isMeasureTool(tool))
    setInspectedCoord(null)
  }, [])

  const handleFinishMeasure = useCallback(() => {
    setMeasureDrawing(false)
    setMeasureCursorPos(null)
  }, [])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && activeTool) selectTool(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, selectTool])

  // Só grava depois de a pessoa mexer: abrir no padrão e sair não pode "congelar" o padrão como se fosse escolha dela
  const prefsTouched = useRef(false)
  useEffect(() => {
    if (!prefsTouched.current) return
    saveRegionPrefs(regiaoId, {
      layers: visibleLayers,
      fauna: { heatmap: faunaHeatmapActive, locations: faunaLocationsActive },
    })
  }, [regiaoId, visibleLayers, faunaHeatmapActive, faunaLocationsActive])

  // "Voltar ao padrão do mapa" (DESIGN.md 13.2): esquece o que estava salvo e põe o mapa como na primeira visita
  const handleResetPrefs = useCallback(() => {
    clearRegionPrefs(regiaoId)
    clearBasemap()
    clearMode()
    prefsTouched.current = false
    setVisibleLayers(initialVisibleSlugs(layers))
    setFaunaHeatmapActive(false)
    setFaunaLocationsActive(false)
    setBasemap(DEFAULT_BASEMAP)
    setMineralFailed(false)
    const [s, e] = datesFromIntent({ kind: 'preset', id: 'year' }, new Date())
    setDateFilter(s, e)
    setAreaFilter({})
    viewModeRef.current = '2d'
    setViewMode('2d')
    handleFitRegion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regiaoId, layers, handleFitRegion])

  // ── Layer toggle handlers ─────────────────────────────────────────────────
  const handleLayerToggle = useCallback((slug: string, isChecked: boolean) => {
    prefsTouched.current = true
    if (slug === FAUNA_HEATMAP) { setFaunaHeatmapActive(isChecked); return }
    if (slug === FAUNA_LOCATIONS) { setFaunaLocationsActive(isChecked); return }
    setVisibleLayers((prev) =>
      isChecked ? [...prev, slug] : prev.filter((s) => s !== slug)
    )
  }, [])

  const handleGroupToggle = useCallback(
    (slugs: string[], isChecked: boolean) => {
      prefsTouched.current = true
      if (slugs.includes(FAUNA_HEATMAP)) { setFaunaHeatmapActive(isChecked); setFaunaLocationsActive(isChecked); return }
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
      prefsTouched.current = true
      setFaunaHeatmapActive(isChecked)
      setFaunaLocationsActive(isChecked)
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

  const EMPTY_FC: MapFeatureCollection = useMemo(
    () => ({ type: 'FeatureCollection', features: [] }),
    []
  )

  // ── Edição de camada (DESIGN.md 13.3) ────────────────────────────────────
  const renderLayers = useMemo(
    () =>
      draft
        ? layers.map((l) => (l.slug === draft.slug ? { ...l, name: draft.edit.name, visualConfig: applyEdit(l.visualConfig as any, draft.edit) as any } : l))
        : layers,
    [layers, draft],
  )

  const handleEditLayer = useCallback(
    (slug: string) => {
      const layer = layers.find((l) => l.slug === slug)
      if (!layer) return
      // o tipo da camada pode depender da geometria dos dados (camada sem tipo no catálogo): o editor olha a primeira feição
      const geometryType = (layerData[slug]?.features[0]?.geometry as any)?.type ?? null
      const initial = readEdit(layer as any, { geometryType, defaultVisibleFallback: isDefaultOnSlug(slug) })
      setSaveLayerError(null)
      setDraft({ slug, initial, edit: initial })
    },
    [layers, layerData],
  )

  // O ícone que uma área tem agora: o da regra do catálogo (o que o marcador usa), senão o do serviço, senão o da camada
  const currentGroupIcon = useCallback(
    (slug: string, groupKey: string) => {
      const layer = layers.find((l) => l.slug === slug)
      const group = layer?.groups?.find((g) => String(g.id) === groupKey)
      return ruleIcon(layer?.visualConfig as any, groupKey) ?? group?.icon ?? readEdit(layer as any).style.iconName ?? 'map-pin'
    },
    [layers],
  )

  const handleEditGroup = useCallback(
    (slug: string, groupKey: string) => {
      const layer = layers.find((l) => l.slug === slug)
      if (!layer) return
      const initial = readEdit(layer as any, { defaultVisibleFallback: isDefaultOnSlug(slug) })
      setSaveLayerError(null)
      setDraft({ slug, groupKey, initial, edit: initial })
    },
    [layers],
  )

  // O mesmo applyEdit do servidor: o mapa fica igual ao que foi gravado sem precisar buscar o catálogo de novo
  const patchLayer = useCallback((slug: string, name: string, visualConfig: any) => {
    const patch = (l: LayerResponseDTO) => (l.slug === slug ? { ...l, name, visualConfig } : l)
    _cache.layers = _cache.layers.map(patch)
    setLayers((prev) => prev.map(patch))
  }, [])

  const putLayer = useCallback(async (slug: string, edit: LayerEdit) => {
    const res = await fetch(`/api/admin/layer-catalog/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.success) throw new Error(json?.error?.message ?? 'Não conseguimos salvar.')
    return json.data as { slug: string; name: string; visualConfig: any }
  }, [])

  const handleSaveLayer = useCallback(async () => {
    if (!draft) return
    setSavingLayer(true)
    setSaveLayerError(null)
    try {
      const saved = await putLayer(draft.slug, draft.edit)
      patchLayer(saved.slug, saved.name, saved.visualConfig)
      const previous = draft.initial
      setDraft(null)
      flash(saved.slug)
      // Aviso no alto, com 10 s para desfazer (o modelo do laboratório). Desfazer também avisa o que aconteceu, no mesmo cartão.
      setNotice({
        id: Date.now(),
        tone: 'success',
        title: draft.groupKey ? `Salvamos o ícone de “${draft.groupKey}”` : `Salvamos “${saved.name}”`,
        body: draft.groupKey ? `Em ${saved.name}. Quem atualizar o mapa já vê a mudança.` : 'Quem atualizar o mapa já vê a mudança.',
        undo: {
          seconds: 10,
          onUndo: async () => {
            try {
              const back = await putLayer(saved.slug, previous)
              patchLayer(back.slug, back.name, back.visualConfig)
              flash(back.slug)
              setNotice({ id: Date.now(), tone: 'success', title: 'Desfeito', body: `“${back.name}” voltou a ser como era.` })
            } catch {
              setNotice({ id: Date.now(), tone: 'error', title: 'Não conseguimos desfazer', body: 'Abra a camada e edite de novo.' })
            }
          },
        },
      })
    } catch (e) {
      // o que a pessoa editou fica na tela (o rascunho não é descartado) e o motivo vem em frase
      setSaveLayerError(e instanceof Error ? e.message : 'Não conseguimos salvar.')
    } finally {
      setSavingLayer(false)
    }
  }, [draft, putLayer, patchLayer, flash])

  // ── Processed layers (ordering-stable: all visible layers, data or empty) ──
  // Iterates `layers` in catalog order — Source/Layer components are registered in
  // the correct MapLibre stack position from the first render, so late-arriving
  // data (e.g. propriedades at 10s) does not push layers to the top of the stack.
  const processedLayers = useMemo(() => {
    return renderLayers.map((layer) => {
      const data = layerData[layer.slug]
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

      // em edição, a camada aparece mesmo desligada: a pré-visualização é para ver a mudança (o editor avisa isso)
      if (draft?.slug === layer.slug) isVisible = true
      if (!isVisible) return null

      // Use loaded data or empty collection — either way Source is registered in order
      let displayData: MapFeatureCollection = data ?? EMPTY_FC
      if (groupByColumn && activeValues.length > 0 && data) {
        displayData = {
          ...data,
          features: data.features.filter((f) =>
            activeValues.includes(f.properties?.[groupByColumn] as string)
          ),
        }
      }

      return { layer, displayData, isIcon: isIconLayer(layer.visualConfig) }
    }).filter((item): item is NonNullable<typeof item> => item !== null)
  }, [renderLayers, visibleLayers, layerData, EMPTY_FC, draft?.slug])

  // ── interactiveLayerIds for click/hover ───────────────────────────────────
  const interactiveLayerIds = useMemo(
    () =>
      processedLayers.flatMap(({ layer, isIcon }) =>
        isIcon
          ? [`${layer.slug}-hover-circle`]
          : [`${layer.slug}-fill`, `${layer.slug}-circle`, `${layer.slug}-line`]
      ),
    [processedLayers]
  )

  // ── Shared feature-click handler (usado por layers MapLibre E por icon markers) ──
  const openFeatureModal = useCallback(
    (slug: string, props: Record<string, any>) => {
      if (slug === 'acoes') setSelectedAcao(props)
      else setSelectedAcao(null)
      openModal('', <FeatureDetails layerType={slug} properties={props} />)
    },
    [openModal]
  )

  // ── Hover handler para icon markers (HTML Markers não disparam onMouseMove do Map) ──
  // Um cartão por vez: com o mouse num grupo de ações, o cartão da ação que está por baixo não abre (DESIGN.md 13.4)
  const [clusterHovered, setClusterHovered] = useState(false)

  const handleMarkerHover = useCallback(
    (props: Record<string, any> | null, coords: [number, number] | null) => {
      setHoveredFeature(props)
      setHoverCoords(coords)
    },
    []
  )

  // Propriedade escolhida (por mouse ou toque): o cartão mostra o que o mapa já sabe e busca o resto
  const selectProperty = useCallback((props: Record<string, any>) => {
    setHoveredPropertyId(props.id ?? null)
    setHoveredPropertyBasic({
      nome: props.nome,
      cod_imovel: props.cod_imovel,
      municipio: props.municipio,
      num_area: props.num_area,
    })
    setHoveredFeature(null)
    setHoverCoords(null)
  }, [])

  // ── Map event handlers ────────────────────────────────────────────────────
  const handleMapClick = useCallback(
    (e: any) => {
      // Coordinate inspector mode
      if (coordInspectorActive) {
        setInspectedCoord({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        return
      }

      // Propriedade: tocar numa propriedade mostra os dados dela, como passar o mouse
      if (propertyInfoActive && e.features?.[0]?.layer.id.startsWith('propriedades-')) {
        selectProperty(e.features[0].properties ?? {})
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

      // Feature click → modal (apenas layers Source+Layer, não icon markers)
      if (!e.features?.length) return
      const feature = e.features[0]
      const slug = feature.layer.id.replace(/-(fill|circle|line|hover-circle)$/, '')
      openFeatureModal(slug, feature.properties ?? {})
    },
    [coordInspectorActive, propertyInfoActive, selectProperty, measureMode, measureDrawing, openFeatureModal]
  )

  const handleMouseMove = useCallback(
    (e: any) => {
      if (measureMode && measureDrawing) {
        setMeasureCursorPos([e.lngLat.lng, e.lngLat.lat])
        setHoveredFeature(null)
        setHoverCoords(null)
        setHoveredPropertyId(null)
        setHoveredPropertyBasic(null)
        return
      }

      if (!e.features?.length) {
        setHoveredFeature(null)
        setHoverCoords(null)
        if (propertyInfoActive) {
          setHoveredPropertyId(null)
          setHoveredPropertyBasic(null)
        }
        return
      }

      const feature = e.features[0]
      const slug = feature.layer.id.replace(/-(fill|circle|line|hover-circle)$/, '')

      // Property info mode: intercept propriedades hover before exclusion check
      if (propertyInfoActive && slug === 'propriedades') {
        selectProperty(feature.properties ?? {})
        return
      }

      if (propertyInfoActive) {
        setHoveredPropertyId(null)
        setHoveredPropertyBasic(null)
      }

      if (EXCLUDED_HOVER.some((ex) => slug.includes(ex))) {
        setHoveredFeature(null)
        setHoverCoords(null)
        return
      }

      setHoveredFeature({ ...feature.properties, _slug: slug })
      setHoverCoords([e.lngLat.lng, e.lngLat.lat])
    },
    [measureMode, measureDrawing, propertyInfoActive, selectProperty]
  )

  const handleContextMenu = useCallback(() => {
    if (measureMode && measureDrawing) handleFinishMeasure()
  }, [measureMode, measureDrawing, handleFinishMeasure])

  // ── Cursor style ──────────────────────────────────────────────────────────
  const cursor = useMemo(() => {
    if (coordInspectorActive) return 'crosshair'
    if (measureMode && measureDrawing) return 'crosshair'
    if (propertyInfoActive && hoveredPropertyId) return 'pointer'
    if (hoveredFeature) return 'pointer'
    return 'grab'
  }, [coordInspectorActive, measureMode, measureDrawing, hoveredFeature, propertyInfoActive, hoveredPropertyId])

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
  const handleClearMeasure = useCallback(() => {
    setMeasurePoints([])
    setMeasureCursorPos(null)
    setMeasureDrawing(true)
  }, [])

  // ── LayerManager options ───────────────────────────────────────────────────
  const layerManagerOptions = useMemo((): LayerManagerOption[] => {
    return renderLayers.map((layer) => {
      const { legendType, iconName, color: baseColor, fillColor: baseFill, fillOpacity: baseFillOpacity } =
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
            fillOpacity: baseFillOpacity,
            category: layer.visualConfig?.category,
            subOptions: groups.map((group) => ({
              id: `${layer.slug}__${group.id}`,
              label: group.label,
              slug: `${layer.slug}__${group.id}`,
              color: group.color || baseColor,
              icon: ruleIcon(config, group.id) ?? group.icon ?? iconName,
              legendType,
              fillColor: baseFill,
              fillOpacity: baseFillOpacity,
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
        fillOpacity: baseFillOpacity,
        category: layer.visualConfig?.category,
      }
    })
  }, [renderLayers])

  // A Fauna fecha a lista, junto das camadas de monitoramento (a lista agrupa por categoria)
  const panelOptions = useMemo((): LayerManagerOption[] => {
          return [
      ...layerManagerOptions,
      {
        id: 'fauna',
        slug: 'fauna',
        editable: false,
        label: 'Fauna exótica (javali)',
        color: 'var(--color-crit)',
        icon: 'paw-print',
        category: 'Monitoramento',
        subOptions: [
          { id: FAUNA_HEATMAP, slug: FAUNA_HEATMAP, label: 'Mapa de calor', color: 'var(--color-crit)', legendType: 'heatmap' },
          { id: FAUNA_LOCATIONS, slug: FAUNA_LOCATIONS, label: 'Localizações pontuais', color: 'var(--color-crit)', legendType: 'circle' },
        ],
      },
    ]
  }, [layerManagerOptions])

  const panelActiveLayers = useMemo(
    () => [
      ...visibleLayers,
      ...(faunaHeatmapActive ? [FAUNA_HEATMAP] : []),
      ...(faunaLocationsActive ? [FAUNA_LOCATIONS] : []),
    ],
    [visibleLayers, faunaHeatmapActive, faunaLocationsActive],
  )

  // Quantas feições cada camada tem no mapa, e quais estão sendo mexidas por um filtro (as duas coisas aparecem na linha)
  const dateOn = !!(dateFilter.startDate || dateFilter.endDate)
  const areaOn = areaFilter.minArea !== undefined || areaFilter.maxArea !== undefined

  const layerCounts = useMemo(() => {
    const c: Record<string, number> = {}
    Object.entries(layerData).forEach(([slug, fc]) => { c[slug] = fc.features.length })
    if (faunaFetched) c.fauna = faunaData.length
    return c
  }, [layerData, faunaFetched, faunaData.length])

  const filterNotes = useMemo(() => {
    const n: Record<string, FilterNote> = {}
    layers.forEach((l) => {
      const note = filterNoteFor(l.slug, dateOn, areaOn)
      if (note) n[l.slug] = note
    })
    return n
  }, [layers, dateOn, areaOn])

  // Onde cada filtro vale, para o painel Filtros dizer (e avisar se nenhuma dessas camadas está ligada)
  const dateAffects = useMemo(() => {
    const hit = layers.filter((l) => l.visualConfig?.dateFilter === true || DATE_SENSITIVE_SLUGS.has(l.slug))
    return { names: hit.map((l) => l.name.trim()), anyOn: hit.some((l) => isLayerOn(l.slug, visibleLayers)) }
  }, [layers, visibleLayers])

  const areaAffects = useMemo(() => {
    const hit = layers.filter((l) => AREA_SENSITIVE_SLUGS.has(l.slug))
    return { names: hit.map((l) => l.name.trim()), anyOn: hit.some((l) => isLayerOn(l.slug, visibleLayers)) }
  }, [layers, visibleLayers])

  // Andamento de cada fonte (DESIGN.md 2.1): só as camadas ligadas mostram carregando ou erro
  const layerStatus = useMemo(() => {
    const st: Record<string, LayerStatus> = {}
    new Set(visibleLayers.map((s) => s.split('__')[0])).forEach((slug) => {
      if (failedLayers.includes(slug)) st[slug] = 'error'
      else if (!layerData[slug]) st[slug] = 'loading'
    })
    if (faunaHeatmapActive || faunaLocationsActive) {
      if (faunaFailed) st.fauna = 'error'
      else if (!faunaFetched) st.fauna = 'loading'
    }
    return st
  }, [visibleLayers, failedLayers, layerData, faunaHeatmapActive, faunaLocationsActive, faunaFailed, faunaFetched])

  const refreshing = loadingLayers || Object.values(layerStatus).includes('loading')

  const handleReload = useCallback(() => {
    _cache.data = {}
    pendingBatch.current = {}
    if (batchTimer.current) { clearTimeout(batchTimer.current); batchTimer.current = null }
    setLayerData({})
    setFailedLayers([])
    fetchingRef.current.clear()
    setFaunaFetched(false)
    setFaunaFailed(false)
    fetchCatalog(true)
  }, [fetchCatalog])

  const handleRetryLayer = useCallback((slug: string) => {
    if (slug === 'fauna') { setFaunaFailed(false); return }
    setFailedLayers((prev) => prev.filter((s) => s !== slug))
    fetchLayerData(slug)
  }, [fetchLayerData])

  // ── Hover popup content ───────────────────────────────────────────────────
  const hoveredLayerConfig = useMemo(() => {
    if (!hoveredFeature) return null
    return layers.find((l) => l.slug === hoveredFeature._slug) ?? null
  }, [hoveredFeature, layers])

  // Cor e ícone do cartão da ação: o mesmo cálculo do marcador (6.2, regra 13), nunca um palpite a partir do evento
  const hoveredAcaoStyle = useMemo(() => {
    if (hoveredFeature?._slug !== 'acoes') return null
    const vc = hoveredLayerConfig?.visualConfig as any
    return resolveFeatureStyle({ baseStyle: vc?.baseStyle || vc, rules: vc?.rules }, { properties: hoveredFeature } as any) as { color?: string; iconName?: string }
  }, [hoveredFeature, hoveredLayerConfig])

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
    <div className="w-full h-full relative">
      <PrismCursor />
      <Map
        ref={mapRef}
        initialViewState={
          saved.camera
            ? { longitude: saved.camera.lng, latitude: saved.camera.lat, zoom: saved.camera.zoom, ...cameraFor(viewMode) }
            : { longitude: center[1], latitude: center[0], zoom }
        }
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle as any}
        maxZoom={BASEMAP_MAX_ZOOM[shownBasemap]}
        // null desliga o terreno (a prop tipada só aceita undefined, mas a biblioteca trata null como "sem terreno")
        terrain={(terrainOn ? { source: 'dem', exaggeration: TERRAIN_EXAGGERATION } : null) as any}
        onMoveEnd={handleMoveEnd}
        cursor={cursor}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onContextMenu={handleContextMenu}
        interactiveLayerIds={interactiveLayerIds}
      >
        {/* ── Relevo (DEM): serve ao terreno 3D e, nas bases claras, ao sombreado. Primeiro filho: fica sob os dados. ── */}
        <Source id="dem" type="raster-dem" tiles={DEM_TILES} encoding="terrarium" tileSize={256} maxzoom={DEM_MAX_ZOOM}>
          {HILLSHADE_BASEMAPS.has(shownBasemap) && (
            <Layer id="relevo" type="hillshade" paint={hillshadePaint(tokens) as any} />
          )}
        </Source>

        {/* ── Data layers (Source+Layer) ── */}
        {processedLayers.flatMap(({ layer, displayData, isIcon }) => {
          // Icon layers: Source invisível apenas para hover detection via MapLibre
          if (isIcon) return [
            <Source
              key={`src-${layer.slug}`}
              id={layer.slug}
              type="geojson"
              data={displayData as any}
            />,
            <Layer
              key={`${layer.slug}-hover-circle`}
              id={`${layer.slug}-hover-circle`}
              source={layer.slug}
              type="circle"
              paint={{ 'circle-radius': 18, 'circle-opacity': 0, 'circle-stroke-width': 0 }}
            />,
          ]
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
            const rawFillPaint: Record<string, any> = mlConfig?.paint ?? toFillPaint(style)
            // Extrai fill-outline-color antes de passar ao MapLibre — será substituído
            // por uma line layer separada (fill-outline-color é sempre 1px fixo)
            const { 'fill-outline-color': extractedOutlineColor, ...fillPaint } = rawFillPaint
            const outlineColor: string =
              mlConfig?.outlinePaint?.['line-color'] ??
              extractedOutlineColor ??
              style?.color ??
              '#3b82f6'
            const outlineWidth: number = mlConfig?.outlinePaint?.['line-width'] ?? style?.weight ?? 1
            const outlineOpacity: number = mlConfig?.outlinePaint?.['line-opacity'] ?? style?.opacity ?? 0.8
            return [
              source,
              <Layer
                key={`${layer.slug}-fill`}
                id={`${layer.slug}-fill`}
                source={layer.slug}
                type="fill"
                paint={fillPaint as any}
              />,
              <Layer
                key={`${layer.slug}-outline`}
                id={`${layer.slug}-outline`}
                source={layer.slug}
                type="line"
                paint={{
                  'line-color': outlineColor,
                  'line-width': outlineWidth,
                  'line-opacity': outlineOpacity,
                }}
              />,
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

        {/* ── Icon layers (HTML Markers com ícones Lucide por feature) ── */}
        {processedLayers
          .filter(({ isIcon, displayData }) => isIcon && displayData.features.length > 0)
          .map(({ layer, displayData }) => (
            <MaplibreIconMarkers
              key={layer.slug}
              layer={layer}
              data={displayData}
              onFeatureClick={openFeatureModal}
              onFeatureHover={handleMarkerHover}
              onClusterHover={setClusterHovered}
              basemap={shownBasemap}
            />
          ))}

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

        {/* ── Hover: cartão da ação (13.4) ── */}
        {clusterHovered ? null : hoveredFeature?._slug === 'acoes' && hoverCoords ? (
          <Popup
            longitude={hoverCoords[0]}
            latitude={hoverCoords[1]}
            closeButton={false}
            offset={[0, -22] as any}
            anchor="bottom"
            className="acao-hover-popup"
          >
            <AcaoHoverCard properties={hoveredFeature} color={hoveredAcaoStyle?.color} iconName={hoveredAcaoStyle?.iconName} />
          </Popup>
        ) : hoveredFeature && hoverCoords && hoverPopupFields?.length ? (
          /* ── Hover: tooltip genérico para outras camadas ── */
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

      {/* Câmera: zoom, bússola e 2D|3D */}
      <CameraControls mapRef={mapRef} ready={mapLoaded} viewMode={viewMode} onViewModeChange={handleViewModeChange} canFitRegion={!!regionBounds} onFitRegion={handleFitRegion} />

      {/* Shapefile uploader */}
      {/* <ShapefileUploader
        onPreview={(data, color) => setPreviewGeoJSON({ data, color })}
        onClearPreview={() => setPreviewGeoJSON(null)}
        onSaveSuccess={() => {
          _cache.data = {}
          _cache.layers = []
          pendingBatch.current = {}
          if (batchTimer.current) { clearTimeout(batchTimer.current); batchTimer.current = null }
          setLayerData({})
          fetchingRef.current.clear()
          fetchCatalog()
        }}
      /> */}

      {/* Dock: o que o mapa mostra (Camadas, Filtros), ferramentas (Medir, Consultar) e Imprimir */}
      <MapDock
        above={activeTool && (
          <ToolFeedback
            tool={activeTool}
            onExit={() => selectTool(null)}
            measure={{ points: measurePoints.length, drawing: measureDrawing, distance: measureDistance, area: measureArea, onClear: handleClearMeasure, onFinish: handleFinishMeasure }}
            coordinate={inspectedCoord}
            property={{ id: hoveredPropertyId, basic: hoveredPropertyBasic }}
          />
        )}
      >
        <DockPanelButton
          id="layers"
          accentTitle={isAdmin ? 'Editar camadas' : undefined}
          titleIcon={isAdmin && (picking || draft) ? LucideIcons.Pencil : undefined}
          accent={!!(isAdmin && (picking || draft))}
          icon={LucideIcons.Layers}
          label="Camadas"
          motion="rise"
          alert={basemap !== shownBasemap || !!draft}
          action={
            <>
              {/* "Editar" só para quem pode, e some enquanto há um editor aberto (lá dentro já há Salvar e Cancelar). O "Atualizar" sai do
                  cabeçalho enquanto se edita: com o título "Editar camadas" e o "Concluir", o cabeçalho ficava pesado e o título quebrava.
                  Quem sai encolhe e some, quem entra cresce (8.4): nada pula. */}
              {isAdmin && (
                <Reveal show={!draft}>
                  <EditModeButton active={picking} onToggle={() => setPicking((v) => !v)} />
                </Reveal>
              )}
              <Reveal show={!(isAdmin && (picking || !!draft))}>
                <RefreshButton refreshing={refreshing} onRefresh={handleReload} />
              </Reveal>
            </>
          }
        >
          <LayersPanel
            basemap={basemap}
            shownBasemap={shownBasemap}
            onBasemapChange={handleBasemapChange}
            onReset={handleResetPrefs}
            onPick={isAdmin && picking ? handleEditLayer : undefined}
            onPickGroup={isAdmin && picking ? handleEditGroup : undefined}
            flashSlug={flashSlug}
            editing={
              draft && draft.groupKey ? (
                <GroupIconEditor
                  layerName={layers.find((l) => l.slug === draft.slug)?.name ?? draft.initial.name}
                  groupLabel={draft.groupKey}
                  icon={draft.edit.ruleIcons?.[draft.groupKey] ?? currentGroupIcon(draft.slug, draft.groupKey)}
                  color={draft.edit.style.color}
                  dirty={JSON.stringify(draft.edit) !== JSON.stringify(draft.initial)}
                  onChange={(icon) => setDraft((d) => (d && d.groupKey ? { ...d, edit: { ...d.edit, ruleIcons: { ...d.edit.ruleIcons, [d.groupKey]: icon } } } : d))}
                  onSave={handleSaveLayer}
                  onCancel={() => { setDraft(null); setSaveLayerError(null) }}
                  saving={savingLayer}
                  error={saveLayerError}
                />
              ) : draft && (
                <LayerEditor
                  savedName={layers.find((l) => l.slug === draft.slug)?.name ?? draft.initial.name}
                  edit={draft.edit}
                  initial={draft.initial}
                  onChange={(edit) => setDraft((d) => (d ? { ...d, edit } : d))}
                  onSave={handleSaveLayer}
                  onCancel={() => { setDraft(null); setSaveLayerError(null) }}
                  saving={savingLayer}
                  error={saveLayerError}
                  iconLocked={!!(layers.find((l) => l.slug === draft.slug)?.visualConfig as any)?.rules?.length}
                  hiddenOnMap={!isLayerOn(draft.slug, visibleLayers)}
                />
              )
            }
            options={panelOptions}
            activeLayers={panelActiveLayers}
            onLayerToggle={handleLayerToggle}
            onHideAll={() => handleToggleAll(false)}
            onGroupToggle={handleGroupToggle}
            counts={layerCounts}
            filterNotes={filterNotes}
            status={layerStatus}
            onRetry={handleRetryLayer}
            loading={loadingLayers}
          />
        </DockPanelButton>
        <DockPanelButton id="filters" icon={LucideIcons.SlidersHorizontal} label="Filtros" motion="slide" badge={activeFilterCount(dateFilter.startDate, dateFilter.endDate, areaFilter)}>
          <FiltersPanel
            startDate={dateFilter.startDate}
            endDate={dateFilter.endDate}
            onDateChange={handleDateChange}
            area={areaFilter}
            onAreaChange={handleAreaChange}
            dateAffects={dateAffects}
            areaAffects={areaAffects}
          />
        </DockPanelButton>
        <DockDivider />
        <ToolMenu
          icon={LucideIcons.Ruler}
          label="Medir"
          motion="tilt"
          tools={[{ id: 'measure-distance', icon: LucideIcons.Ruler }, { id: 'measure-area', icon: LucideIcons.SquareDashed }]}
          active={activeTool === 'measure-distance' || activeTool === 'measure-area' ? activeTool : null}
          onSelect={selectTool}
        />
        <ToolMenu
          icon={LucideIcons.Crosshair}
          label="Consultar"
          motion="spin"
          tools={[{ id: 'coords', icon: LucideIcons.Crosshair }, { id: 'property', icon: LucideIcons.Info }]}
          active={activeTool === 'coords' || activeTool === 'property' ? activeTool : null}
          onSelect={selectTool}
        />
        <DockDivider />
        <MaplibreSnapshotControl activeLayers={visibleLayers} mapRef={mapRef} />
      </MapDock>

      {/* Aviso (salvou, desfazer): no alto e ao centro, com contador (DESIGN.md 12) */}
      <div className="pointer-events-none absolute inset-x-3 top-4 z-[2000] flex justify-center">
        <Notice notice={notice} onClose={() => setNotice(null)} />
      </div>

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
          // Invalidate 'acoes' cache so it re-fetches with updated data
          delete _cache.data['acoes']
          setLayerData((prev) => { const next = { ...prev }; delete next['acoes']; return next })
          fetchingRef.current.delete('acoes')
          setIsEditOpen(false)
          closeModal()
        }}
      />
    </div>
  )
}
