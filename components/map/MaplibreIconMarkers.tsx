'use client'

import { Layer, Marker, Popup, Source, useMap } from 'react-map-gl/maplibre'
import * as LucideIcons from 'lucide-react'
import { Check, MapPin } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Supercluster from 'supercluster'
import { cn } from '@/lib/utils'
import { resolveFeatureStyle, toPascalCase } from './helpers/map-visuals'
import { ClusterHoverCard, type ClusterGroup } from './ClusterHoverCard'
import { tidyText } from './helpers/text'
import { clusterFootprint } from './helpers/footprint'
import { DEFAULT_BASEMAP, type BasemapKey } from './helpers/basemaps'
import { useOverlayInk } from './helpers/use-overlay-ink'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { LayerResponseDTO, MapFeatureCollection } from '@/types/map-dto'

// Marcadores das camadas de ícone (DESIGN.md 13.4). Um círculo só, com o ícone grande dentro e um fio branco que o separa do
// satélite (antes eram três camadas empilhadas, ~33 px, e o ícone de 13 px se perdia). Perto uns dos outros, viram uma bolha
// que diz "25 ações" em palavras (um número solto fazia a pessoa pensar no que era) e, ao passar o mouse, mostra o que tem lá
// dentro por área, sem precisar ampliar o mapa, e desenha no mapa a MANCHA de onde elas estão (o tamanho real do grupo).
// Os marcadores se empilhavam e escondiam uns aos outros. O status (quando a feição tem) vira um selo no canto:
// a pessoa vê o que está acontecendo sem abrir nada.

// Com terreno 3D, cada Marker lê o framebuffer de profundidade (gl.readPixels: a GPU para e espera) a cada ~100 ms só para
// esmaecer atrás de morro. Com dezenas de ícones o mapa cai para ~20 fps; sem a checagem, o ícone só não esmaece atrás do relevo.
const skipOcclusionCheck = (marker: unknown) => {
  if (marker) (marker as { _updateOpacity: () => void })._updateOpacity = () => {}
}

// Selo de status: cor e forma dizem o estado (o concluído leva um check). Cores só dos tokens.
const STATUS_BADGE: Record<string, { label: string; className: string; check?: boolean }> = {
  'Identificado': { label: 'Identificado', className: 'bg-warn' },
  'Em Recuperação': { label: 'Em recuperação', className: 'bg-water' },
  'Concluído': { label: 'Concluído', className: 'bg-ok', check: true },
}

const CLUSTER_RADIUS = 64 // px: a bolha com texto ("25 ações") é mais larga que o marcador (28), e não podem encostar
const CLUSTER_MAX_ZOOM = 16 // acima disso cada ação aparece sozinha
const FOOTPRINT_RADIUS_PX = 16 // folga em volta de cada ponto na mancha do grupo

// translate e scale precisam estar na lista da transição (no Tailwind v4 não entram em transition-transform: caso C6)
const markerMotion = 'transition-[translate,scale,box-shadow] duration-300 ease-spring hover:-translate-y-0.5 hover:scale-110 active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40'

interface Props {
  layer: LayerResponseDTO
  data: MapFeatureCollection
  onFeatureClick: (slug: string, props: Record<string, any>) => void
  onFeatureHover: (props: Record<string, any> | null, coords: [number, number] | null) => void
  /** avisa quando o mouse entra ou sai de um grupo: o mapa esconde o cartão da ação que está por baixo (um cartão por vez) */
  onClusterHover?: (active: boolean) => void
  /** a base do mapa: a mancha do grupo troca de cor para se ver em cada uma (clara no satélite, verde no Mineral) */
  basemap?: BasemapKey
}

interface View { zoom: number; bbox: [number, number, number, number] }

export function MaplibreIconMarkers({ layer, data, onFeatureClick, onFeatureHover, onClusterHover, basemap = DEFAULT_BASEMAP }: Props) {
  const { current: mapRef } = useMap()
  const vc = layer.visualConfig
  // Normaliza para o mesmo formato que o Leaflet usa em resolveFeatureStyle
  const normalizedConfig = useMemo(() => ({
    baseStyle: vc?.baseStyle || vc,
    rules: vc?.rules,
  }), [vc])

  // O que a pessoa está vendo: só os marcadores da tela (com folga) viram DOM, e o zoom decide quem se agrupa.
  const [view, setView] = useState<View | null>(null)
  useEffect(() => {
    const map = mapRef?.getMap()
    if (!map) return
    const read = () => {
      const b = map.getBounds()
      const padLng = (b.getEast() - b.getWest()) * 0.2
      const padLat = (b.getNorth() - b.getSouth()) * 0.2
      setView({ zoom: Math.floor(map.getZoom()), bbox: [b.getWest() - padLng, b.getSouth() - padLat, b.getEast() + padLng, b.getNorth() + padLat] })
    }
    read()
    map.on('moveend', read)
    return () => { map.off('moveend', read) }
  }, [mapRef])

  const features = useMemo(
    () => data.features.filter((f) => f.geometry?.type === 'Point' && Array.isArray((f.geometry as any).coordinates)),
    [data],
  )
  const index = useMemo(() => {
    const sc = new Supercluster<{ idx: number }>({ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM })
    sc.load(features.map((f, idx) => ({ type: 'Feature' as const, geometry: f.geometry as any, properties: { idx } })))
    return sc
  }, [features])
  const items = useMemo(() => (view ? index.getClusters(view.bbox, view.zoom) : []), [index, view])

  // O que tem dentro do grupo sob o mouse, por área (o ícone de cada área é o do mapa): "25 ações" sem dizer quais era o problema.
  const [hoveredCluster, setHoveredCluster] = useState<{ id: number; lng: number; lat: number; count: number } | null>(null)
  // A mancha: o contorno do que as ações do grupo ocupam, com uma folga em volta de cada ponto. Fica a última calculada, e só a
  // opacidade muda (o MapLibre faz a transição), então ela aparece e some suave em vez de brotar (8.4).
  const [footprint, setFootprint] = useState<Feature<Polygon | MultiPolygon> | null>(null)
  const ink = useOverlayInk(basemap)
  useEffect(() => {
    if (!hoveredCluster) return
    const zoom = mapRef?.getMap().getZoom() ?? view?.zoom ?? 10
    const coords = index.getLeaves(hoveredCluster.id, Infinity).map((l) => l.geometry.coordinates as [number, number])
    setFootprint(clusterFootprint(coords, FOOTPRINT_RADIUS_PX, zoom))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredCluster, index])

  useEffect(() => {
    onClusterHover?.(hoveredCluster !== null)
    return () => onClusterHover?.(false)
  }, [hoveredCluster, onClusterHover])
  const clusterGroups = useMemo<ClusterGroup[]>(() => {
    if (!hoveredCluster) return []
    const byArea = new Map<string, ClusterGroup>()
    for (const leaf of index.getLeaves(hoveredCluster.id, Infinity)) {
      const feature = features[leaf.properties.idx]
      if (!feature) continue
      const props = feature.properties ?? {}
      const style = resolveFeatureStyle(normalizedConfig, feature) as any
      const area = tidyText(String(props.eixo_tematico || props.tipo || '')) || 'Sem área definida'
      const group = byArea.get(area) ?? { area, count: 0, color: style.color || 'var(--color-primary)', iconName: style.iconName || 'map-pin' }
      group.count += 1
      byArea.set(area, group)
    }
    return [...byArea.values()].sort((a, b) => b.count - a.count)
  }, [hoveredCluster, index, features, normalizedConfig])

  return (
    <>
      <Source id={`${layer.slug}-grupo-mancha`} type="geojson" data={footprint ?? { type: 'FeatureCollection', features: [] }}>
        <Layer id={`${layer.slug}-grupo-mancha-fill`} type="fill" paint={{ 'fill-color': ink.fillColor, 'fill-opacity': hoveredCluster ? ink.fillOpacity : 0, 'fill-opacity-transition': { duration: 300 }, 'fill-color-transition': { duration: 300 } }} />
        <Layer id={`${layer.slug}-grupo-mancha-casing`} type="line" paint={{ 'line-color': ink.casingColor, 'line-width': 5, 'line-opacity': hoveredCluster ? ink.casingOpacity : 0, 'line-opacity-transition': { duration: 300 } }} />
        <Layer id={`${layer.slug}-grupo-mancha-line`} type="line" paint={{ 'line-color': ink.lineColor, 'line-width': 2.5, 'line-opacity': hoveredCluster ? 1 : 0, 'line-opacity-transition': { duration: 300 } }} />
      </Source>
      {items.map((item) => {
        const [lng, lat] = item.geometry.coordinates as [number, number]
        if (typeof lng !== 'number' || typeof lat !== 'number') return null

        if ('cluster' in item.properties && item.properties.cluster) {
          const { cluster_id: id, point_count: count } = item.properties
          return (
            <Marker key={`${layer.slug}-c${id}`} ref={skipOcclusionCheck} longitude={lng} latitude={lat} anchor="center">
              <button
                type="button"
                aria-label={`${count} ações juntas. Clique para ampliar e separar.`}
                onClick={(e) => {
                  e.stopPropagation()
                  setHoveredCluster(null)
                  mapRef?.easeTo({ center: [lng, lat], zoom: Math.min(index.getClusterExpansionZoom(id as number) + 0.5, 18), duration: 500 })
                }}
                onMouseEnter={() => setHoveredCluster({ id: id as number, lng, lat, count: count as number })}
                onMouseLeave={() => setHoveredCluster(null)}
                onFocus={() => setHoveredCluster({ id: id as number, lng, lat, count: count as number })}
                onBlur={() => setHoveredCluster(null)}
                className={cn('flex h-8 cursor-pointer items-center justify-center whitespace-nowrap rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-control ring-2 ring-white', markerMotion)}
              >
                {count} ações
              </button>
            </Marker>
          )
        }

        const idx = (item.properties as { idx: number }).idx
        const feature = features[idx]
        if (!feature) return null

        // resolveFeatureStyle processa todas as regras em ordem (categoria → status).
        // Regras de categoria definem color + iconName.
        // Regras de status podem definir opacity (para camadas concluídas).
        const style = resolveFeatureStyle(normalizedConfig, feature) as any
        const color: string = style.color || 'var(--color-primary)'
        const iconName: string = style.iconName || 'map-pin'
        const opacity: number = style.opacity ?? 1
        const IconComponent: React.ElementType = (LucideIcons as any)[toPascalCase(iconName)] || MapPin
        const props = feature.properties ?? {}
        const status = STATUS_BADGE[props.status as string]
        const name = (props.name || props.acao || 'Ação') as string
        const key = feature.id != null ? `${layer.slug}-${feature.id}` : `${layer.slug}-idx-${idx}`

        return (
          <Marker
            key={key}
            ref={skipOcclusionCheck}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onFeatureClick(layer.slug, props)
            }}
          >
            <div
              role="button"
              tabIndex={0}
              aria-label={status ? `${name}. ${status.label}.` : name}
              style={{ opacity, backgroundColor: color }}
              className={cn('relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full shadow-control ring-2 ring-white', markerMotion)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFeatureClick(layer.slug, props) } }}
              onMouseEnter={() => onFeatureHover({ ...props, _slug: layer.slug }, [lng, lat])}
              onMouseLeave={() => onFeatureHover(null, null)}
              onFocus={() => onFeatureHover({ ...props, _slug: layer.slug }, [lng, lat])}
              onBlur={() => onFeatureHover(null, null)}
            >
              <IconComponent size={16} color="white" strokeWidth={2} aria-hidden />
              {status && (
                <span aria-hidden className={cn('absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-white', status.className)}>
                  {status.check && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
                </span>
              )}
            </div>
          </Marker>
        )
      })}
      {hoveredCluster && clusterGroups.length > 0 && (
        <Popup longitude={hoveredCluster.lng} latitude={hoveredCluster.lat} closeButton={false} offset={[0, -22] as any} anchor="bottom" className="acao-hover-popup">
          <ClusterHoverCard count={hoveredCluster.count} groups={clusterGroups} />
        </Popup>
      )}
    </>
  )
}
