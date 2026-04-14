import type { VisualStyle } from '@/types/map-dto';
import type { Feature } from 'geojson';

export type MapLibreLayerType = 'fill' | 'circle' | 'line';

/**
 * Determines the MapLibre layer type from a VisualStyle and/or a GeoJSON feature.
 * Style type takes priority over geometry type inference.
 */
export function resolveLayerType(
  style?: VisualStyle | null,
  feature?: Feature | null
): MapLibreLayerType {
  if (style?.type === 'line') return 'line';
  if (style?.type === 'circle' || style?.type === 'point') return 'circle';
  if (style?.type === 'polygon') return 'fill';

  const geomType = feature?.geometry?.type;
  if (geomType === 'Point' || geomType === 'MultiPoint') return 'circle';
  if (geomType === 'LineString' || geomType === 'MultiLineString') return 'line';

  return 'fill';
}

export interface FillPaint {
  'fill-color': string;
  'fill-opacity': number;
}

export interface CirclePaint {
  'circle-color': string;
  'circle-radius': number;
  'circle-opacity': number;
}

export interface LinePaint {
  'line-color': string;
  'line-width': number;
  'line-opacity': number;
}

/**
 * Converts a Leaflet-style VisualStyle to MapLibre fill paint properties.
 * Phase 4 will replace this with direct MapLibre paint JSON from the catalog.
 */
export function toFillPaint(style?: VisualStyle | null): FillPaint {
  return {
    'fill-color': style?.fillColor ?? style?.color ?? '#3b82f6',
    'fill-opacity': style?.fillOpacity ?? style?.opacity ?? 0.5,
  };
}

/**
 * Converts a Leaflet-style VisualStyle to MapLibre circle paint properties.
 */
export function toCirclePaint(style?: VisualStyle | null): CirclePaint {
  return {
    'circle-color': style?.color ?? '#3b82f6',
    'circle-radius': style?.radius ?? 6,
    'circle-opacity': style?.opacity ?? 0.8,
  };
}

/**
 * Converts a Leaflet-style VisualStyle to MapLibre line paint properties.
 */
export function toLinePaint(style?: VisualStyle | null): LinePaint {
  return {
    'line-color': style?.color ?? '#3b82f6',
    'line-width': style?.weight ?? 2,
    'line-opacity': style?.opacity ?? 0.8,
  };
}
