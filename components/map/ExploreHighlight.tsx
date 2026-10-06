'use client'

import { Layer, Source } from 'react-map-gl/maplibre'
import type { Geometry } from 'geojson'
import type { BasemapKey } from './helpers/basemaps'
import { useOverlayInk } from './helpers/use-overlay-ink'

// O que a pessoa escolheu no painel Explorar, desenhado no mapa (DESIGN.md 13.5): um contorno claro com fio escuro no satélite e
// verde com fio claro nas bases claras (a mesma regra da mancha dos grupos, 6.2 regra 5). Polígono ganha preenchimento leve;
// ponto, um anel em volta do marcador.
export function ExploreHighlight({ geometry, basemap }: { geometry: Geometry; basemap: BasemapKey }) {
  const ink = useOverlayInk(basemap)
  return (
    <Source id="explorar-selecao" type="geojson" data={{ type: 'Feature', properties: {}, geometry }}>
      <Layer id="explorar-selecao-fill" type="fill" filter={['==', '$type', 'Polygon']} paint={{ 'fill-color': ink.fillColor, 'fill-opacity': ink.fillOpacity }} />
      <Layer id="explorar-selecao-casing" type="line" filter={['!=', '$type', 'Point']} paint={{ 'line-color': ink.casingColor, 'line-width': 6, 'line-opacity': ink.casingOpacity }} />
      <Layer id="explorar-selecao-line" type="line" filter={['!=', '$type', 'Point']} paint={{ 'line-color': ink.lineColor, 'line-width': 3 }} />
      <Layer id="explorar-selecao-ponto-casing" type="circle" filter={['==', '$type', 'Point']} paint={{ 'circle-radius': 16, 'circle-color': 'transparent', 'circle-stroke-color': ink.casingColor, 'circle-stroke-width': 7, 'circle-stroke-opacity': ink.casingOpacity }} />
      <Layer id="explorar-selecao-ponto" type="circle" filter={['==', '$type', 'Point']} paint={{ 'circle-radius': 16, 'circle-color': ink.fillColor, 'circle-opacity': ink.fillOpacity, 'circle-stroke-color': ink.lineColor, 'circle-stroke-width': 3 }} />
    </Source>
  )
}
