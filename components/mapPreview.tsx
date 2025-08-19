// Em 'components/preview/MapPreview.tsx'

"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"
import { LatLngBounds } from "leaflet"
import type { FeatureCollection } from "geojson"

interface MapPreviewProps {
  geometry: FeatureCollection
}

export function MapPreview({ geometry }: MapPreviewProps) {
  // Calcula a área que a trilha ocupa para dar o zoom correto
  const bounds = new LatLngBounds(
    // @ts-ignore
    geometry.features[0].geometry.coordinates.map(c => [c[1], c[0]])
  )

  return (
    <MapContainer
      bounds={bounds}
      style={{ height: "400px", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Este componente desenha a trilha automaticamente! */}
      <GeoJSON data={geometry} />
    </MapContainer>
  )
}