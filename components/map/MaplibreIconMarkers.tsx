'use client'

import { Marker } from 'react-map-gl/maplibre'
import * as LucideIcons from 'lucide-react'
import { MapPin } from 'lucide-react'
import { useMemo } from 'react'
import { resolveFeatureStyle, toPascalCase } from './helpers/map-visuals'
import type { LayerResponseDTO, MapFeatureCollection } from '@/types/map-dto'

interface Props {
  layer: LayerResponseDTO
  data: MapFeatureCollection
  onFeatureClick: (slug: string, props: Record<string, any>) => void
  onFeatureHover: (props: Record<string, any> | null, coords: [number, number] | null) => void
}

export function MaplibreIconMarkers({ layer, data, onFeatureClick, onFeatureHover }: Props) {
  const vc = layer.visualConfig
  // Normaliza para o mesmo formato que o Leaflet usa em resolveFeatureStyle
  const normalizedConfig = useMemo(() => ({
    baseStyle: vc?.baseStyle || vc,
    rules: vc?.rules,
  }), [vc])

  return (
    <>
      {data.features.map((feature, idx) => {
        if (!feature.geometry || feature.geometry.type !== 'Point') return null
        const [lng, lat] = (feature.geometry as any).coordinates as [number, number]
        if (typeof lng !== 'number' || typeof lat !== 'number') return null

        // resolveFeatureStyle processa todas as regras em ordem (categoria → status).
        // Regras de categoria definem color + iconName.
        // Regras de status podem definir opacity (para camadas concluídas) e borderColor.
        const style = resolveFeatureStyle(normalizedConfig, feature) as any
        const color: string = style.color || '#3b82f6'
        const iconName: string = style.iconName || 'map-pin'
        const opacity: number = style.opacity ?? 1
        const borderColor: string = style.borderColor || 'white'

        const IconComponent: React.ElementType =
          (LucideIcons as any)[toPascalCase(iconName)] || MapPin

        const featureKey =
          feature.id != null ? `${layer.slug}-${feature.id}` : `${layer.slug}-idx-${idx}`

        return (
          <Marker
            key={featureKey}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onFeatureClick(layer.slug, feature.properties ?? {})
            }}
          >
            <div
              style={{ opacity, borderColor, borderWidth: 2, borderStyle: 'solid' }}
              className="rounded-full p-1.5 shadow-md cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
              onMouseEnter={() =>
                onFeatureHover(
                  { ...(feature.properties ?? {}), _slug: layer.slug },
                  [lng, lat],
                )
              }
              onMouseLeave={() => onFeatureHover(null, null)}
            >
              <div
                style={{ backgroundColor: color }}
                className="rounded-full p-1"
              >
                <IconComponent size={13} color="white" strokeWidth={2.5} />
              </div>
            </div>
          </Marker>
        )
      })}
    </>
  )
}
