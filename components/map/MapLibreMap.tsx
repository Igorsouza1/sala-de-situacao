'use client';

import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';
import type { LayerResponseDTO } from '@/types/map-dto';
import { resolveLayerType, toFillPaint, toCirclePaint, toLinePaint, type MapLibreLayerType } from './helpers/maplibre-layer';

/**
 * MapLibreMap — Fase 3: Engine Swap.
 *
 * Consome a mesma API /api/map/layers usada pelo Leaflet.
 * visual_config ainda está em formato Leaflet-style (VisualStyle); a Fase 4
 * migrará para MapLibre-native paint/layout JSON.
 *
 * Sem lazy loading, clustering nem controles avançados — esses ficam na Fase 5.
 */

interface MapLibreMapProps {
  /** [lat, lng] — mesma convenção do Leaflet para compatibilidade de props */
  center?: [number, number];
  zoom?: number;
}

export default function MapLibreMap({
  center = [-21.327773, -56.694734],
  zoom = 11,
}: MapLibreMapProps) {
  const [layers, setLayers] = useState<LayerResponseDTO[]>([]);

  useEffect(() => {
    fetch('/api/map/layers')
      .then(r => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setLayers(data as LayerResponseDTO[]);
      })
      .catch(err => console.error('[MapLibreMap] Failed to fetch layers:', err));
  }, []);

  return (
    <div className="w-full h-screen relative z-10">
    <Map
      initialViewState={{
        longitude: center[1], // center é [lat, lng] — MapLibre usa longitude primeiro
        latitude: center[0],
        zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    >
      <NavigationControl position="top-right" />

      {layers.flatMap(layer => {
        if (!layer.data?.features?.length) return [];

        const vc = layer.visualConfig;
        // Fase 4: usar config MapLibre-nativo do catalog quando disponível
        const mlConfig = vc?.maplibre;
        // Fallback para helpers de tradução (camadas sem maplibre key ainda)
        const style = vc?.baseStyle ?? vc;
        const firstFeature = layer.data.features[0] as any;
        const layerType: MapLibreLayerType = (mlConfig?.type as MapLibreLayerType) ?? resolveLayerType(style, firstFeature);

        const source = (
          <Source
            key={`src-${layer.slug}`}
            id={layer.slug}
            type="geojson"
            data={layer.data as any}
          />
        );

        if (layerType === 'fill') {
          const paint = mlConfig?.paint ?? toFillPaint(style);
          return [
            source,
            <Layer
              key={`${layer.slug}-fill`}
              id={`${layer.slug}-fill`}
              source={layer.slug}
              type="fill"
              paint={paint as any}
            />,
            // Outline separado apenas quando não há fill-outline-color no paint nativo
            ...(!mlConfig ? [<Layer
              key={`${layer.slug}-outline`}
              id={`${layer.slug}-outline`}
              source={layer.slug}
              type="line"
              paint={{
                'line-color': style?.color ?? '#3b82f6',
                'line-width': style?.weight ?? 1,
                'line-opacity': style?.opacity ?? 0.8,
              }}
            />] : []),
          ];
        }

        if (layerType === 'circle') {
          const paint = mlConfig?.paint ?? toCirclePaint(style);
          return [
            source,
            <Layer
              key={`${layer.slug}-circle`}
              id={`${layer.slug}-circle`}
              source={layer.slug}
              type="circle"
              paint={paint as any}
            />,
          ];
        }

        // line
        const paint = mlConfig?.paint ?? toLinePaint(style);
        return [
          source,
          <Layer
            key={`${layer.slug}-line`}
            id={`${layer.slug}-line`}
            source={layer.slug}
            type="line"
            paint={paint as any}
          />,
        ];
      })}
    </Map>
    </div>
  );
}
