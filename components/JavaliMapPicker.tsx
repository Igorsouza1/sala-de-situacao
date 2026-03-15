'use client'

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'

import L from 'leaflet'

// Fix default icon paths for Leaflet in Next.js
// We create a generic red icon or use standard blue if preferred.
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

function MapEvents({ onLocationSelected }: { onLocationSelected: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FlyToCoords({ coords }: { coords: { lat: number; lng: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], map.getZoom() > 14 ? map.getZoom() : 14)
    }
  }, [coords, map])

  return null
}

interface JavaliMapPickerProps {
  initialCoords: { lat: number; lng: number } | null;
  onLocationSelected: (lat: number, lng: number) => void;
}

export default function JavaliMapPicker({ initialCoords, onLocationSelected }: JavaliMapPickerProps) {
  // Centro padrão: região de Bonito/MS onde ocorre o monitoramento
  const defaultCenter: [number, number] = [-21.3277, -56.6947]
  const center = initialCoords ? [initialCoords.lat, initialCoords.lng] : defaultCenter
  const zoom = initialCoords ? 14 : 4

  return (
    <MapContainer
      center={center as L.LatLngExpression}
      zoom={zoom}
      style={{ height: '100%', width: '100%', zIndex: 10 }}
      id="javali-map-picker"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapEvents onLocationSelected={onLocationSelected} />
      <FlyToCoords coords={initialCoords} />
      {initialCoords && (
        <Marker position={[initialCoords.lat, initialCoords.lng]} icon={icon} />
      )}
    </MapContainer>
  )
}
