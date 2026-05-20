import type { VisualStyle } from '@/types/map-dto';
import type { Feature } from 'geojson';

export type MapLibreLayerType = 'fill' | 'circle' | 'line';

/**
 * Determines the MapLibre layer type from a GeoJSON feature and/or VisualStyle.
 * Geometry type is ground truth — style hint is only a fallback when geometry is unknown.
 */
export function resolveLayerType(
  style?: VisualStyle | null,
  feature?: Feature | null
): MapLibreLayerType {
  const geomType = feature?.geometry?.type;
  if (geomType === 'Point' || geomType === 'MultiPoint') return 'circle';
  if (geomType === 'LineString' || geomType === 'MultiLineString') return 'line';
  if (geomType === 'Polygon' || geomType === 'MultiPolygon') return 'fill';

  // Geometry unknown — fall back to style hint
  if (style?.type === 'line') return 'line';
  if (style?.type === 'circle' || style?.type === 'point') return 'circle';

  // Also check mapMarker.type (legacy DB field nested inside visual_config)
  const markerType = (style as any)?.mapMarker?.type;
  if (markerType === 'line') return 'line';
  if (markerType === 'circle' || markerType === 'point') return 'circle';
  if (markerType === 'polygon') return 'fill';

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
  const marker = (style as any)?.mapMarker;
  return {
    'fill-color': style?.fillColor ?? style?.color ?? marker?.fillColor ?? marker?.color ?? '#3b82f6',
    'fill-opacity': style?.fillOpacity ?? style?.opacity ?? marker?.fillOpacity ?? marker?.opacity ?? 0.5,
  };
}

/**
 * Converts a Leaflet-style VisualStyle to MapLibre circle paint properties.
 */
export function toCirclePaint(style?: VisualStyle | null): CirclePaint {
  const marker = (style as any)?.mapMarker;
  return {
    'circle-color': style?.color ?? marker?.color ?? '#3b82f6',
    'circle-radius': style?.radius ?? marker?.radius ?? 6,
    'circle-opacity': style?.opacity ?? marker?.opacity ?? 0.8,
  };
}

/**
 * Converts a Leaflet-style VisualStyle to MapLibre line paint properties.
 */
export function toLinePaint(style?: VisualStyle | null): LinePaint {
  const marker = (style as any)?.mapMarker;
  return {
    'line-color': style?.color ?? marker?.color ?? '#3b82f6',
    'line-width': style?.weight ?? marker?.weight ?? 2,
    'line-opacity': style?.opacity ?? marker?.opacity ?? 0.8,
  };
}
