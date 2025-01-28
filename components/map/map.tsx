"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, ZoomControl, Marker, Popup } from "react-leaflet"
import { Icon, type LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"

// Define types for our map props
interface MapProps {
  center?: LatLngExpression
  zoom?: number
  markers?: Array<{
    position: LatLngExpression
    title: string
    description?: string
  }>
}

export default function Map({
  center = [-20.481, -54.6352], // Default to Campo Grande - MS
  zoom = 13,
  markers = [],
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Custom icon for markers
  const customIcon = new Icon({
    iconUrl: "/marker-icon.png", // You'll need to add this image to your public folder
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  // Don't render the map on the server side
  if (!isMounted) {
    return (
      <div className="w-screen h-screen bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Carregando mapa...</span>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative">
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false} // We'll add our own zoom control
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />

        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position} icon={customIcon}>
            <Popup>
              <div >
                <h3 className="font-semibold text-lg">{marker.title}</h3>
                {marker.description && <p className=" text-sm text-gray-600">{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

