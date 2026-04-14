'use client';

import dynamic from 'next/dynamic';
import { FEATURES } from '@/lib/feature-flags';

const LeafletMap = dynamic(() => import('./map'), { ssr: false });
const MapLibreMap = dynamic(() => import('./MapLibreMap'), { ssr: false });

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

/**
 * Entry point do mapa com feature flag.
 * NEXT_PUBLIC_MAP_ENGINE=maplibre → MapLibreMap
 * NEXT_PUBLIC_MAP_ENGINE=leaflet  → LeafletMap (padrão)
 */
export default function MapEntry(props: MapProps) {
  return FEATURES.MAP_ENGINE === 'maplibre'
    ? <MapLibreMap {...props} />
    : <LeafletMap {...props} />;
}
