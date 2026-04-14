'use client';

import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';
import type { LayerResponseDTO } from '@/types/map-dto';
import { resolveLayerType, toFillPaint, toCirclePaint, toLinePaint } from './helpers/maplibre-layer';

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
        const style = vc?.baseStyle ?? vc;
        const firstFeature = layer.data.features[0] as any;
        const layerType = resolveLayerType(style, firstFeature);

        const source = (
          <Source
            key={`src-${layer.slug}`}
            id={layer.slug}
            type="geojson"
            data={layer.data as any}
          />
        );

        if (layerType === 'fill') {
          return [
            source,
            <Layer
              key={`${layer.slug}-fill`}
              id={`${layer.slug}-fill`}
              source={layer.slug}
              type="fill"
              paint={toFillPaint(style)}
            />,
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
          ];
        }

        if (layerType === 'circle') {
          return [
            source,
            <Layer
              key={`${layer.slug}-circle`}
              id={`${layer.slug}-circle`}
              source={layer.slug}
              type="circle"
              paint={toCirclePaint(style)}
            />,
          ];
        }

        // line
        return [
          source,
          <Layer
            key={`${layer.slug}-line`}
            id={`${layer.slug}-line`}
            source={layer.slug}
            type="line"
            paint={toLinePaint(style)}
          />,
        ];
      })}
    </Map>
    </div>
  );
}
