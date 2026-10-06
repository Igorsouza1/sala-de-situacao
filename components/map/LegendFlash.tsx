'use client'

import { Layer, Source } from 'react-map-gl/maplibre'
import type { Feature } from 'geojson'
import type { BasemapKey } from './helpers/basemaps'
import { useOverlayInk } from './helpers/use-overlay-ink'

// O que um item da legenda representa, destacado no mapa por uma piscada suave (DESIGN.md 13.7): polígonos, linhas e pontos desenhados
// pelo mapa (os pinos das ações piscam por conta própria). `on` liga e desliga o destaque; o MapLibre faz a transição de 250 ms, então a
// piscada é suave e não um liga-desliga seco. A cor muda com a base, como a seleção do Explorar (claro no satélite, verde nas claras).
export function LegendFlash({ features, on, basemap }: { features: Feature[]; on: boolean; basemap: BasemapKey }) {
  const ink = useOverlayInk(basemap)
  const fade = { duration: 250 }
  return (
    <Source id="legenda-piscada" type="geojson" data={{ type: 'FeatureCollection', features }}>
      <Layer id="legenda-piscada-fill" type="fill" filter={['==', '$type', 'Polygon']} paint={{ 'fill-color': ink.fillColor, 'fill-opacity': on ? ink.fillOpacity + 0.12 : 0, 'fill-opacity-transition': fade }} />
      <Layer id="legenda-piscada-casing" type="line" filter={['!=', '$type', 'Point']} paint={{ 'line-color': ink.casingColor, 'line-width': 7, 'line-opacity': on ? ink.casingOpacity : 0, 'line-opacity-transition': fade }} />
      <Layer id="legenda-piscada-line" type="line" filter={['!=', '$type', 'Point']} paint={{ 'line-color': ink.lineColor, 'line-width': 3.5, 'line-opacity': on ? 1 : 0, 'line-opacity-transition': fade }} />
      <Layer id="legenda-piscada-ponto-casing" type="circle" filter={['==', '$type', 'Point']} paint={{ 'circle-radius': 14, 'circle-color': 'transparent', 'circle-stroke-color': ink.casingColor, 'circle-stroke-width': 7, 'circle-stroke-opacity': on ? ink.casingOpacity : 0, 'circle-stroke-opacity-transition': fade }} />
      <Layer id="legenda-piscada-ponto" type="circle" filter={['==', '$type', 'Point']} paint={{ 'circle-radius': 14, 'circle-color': ink.fillColor, 'circle-opacity': on ? ink.fillOpacity + 0.12 : 0, 'circle-opacity-transition': fade, 'circle-stroke-color': ink.lineColor, 'circle-stroke-width': 3.5, 'circle-stroke-opacity': on ? 1 : 0, 'circle-stroke-opacity-transition': fade }} />
    </Source>
  )
}
