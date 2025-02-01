"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Icon, type LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
import { MapLayersCard } from "./MapLayerCard"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number
  markers?: Array<{
    position: LatLngExpression
    title: string
    description?: string
  }>
}

const layerOptions = [
  { id: "layer1", label: "Layer 1" },
  { id: "layer2", label: "Layer 2" },
  { id: "layer3", label: "Layer 3" },
]

export default function Map({ center = [-21.327773, -56.694734], zoom = 11, markers = [] }: MapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const customIcon = new Icon({
    iconUrl: "/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  const handleLayerToggle = (id: string, isChecked: boolean) => {
    setVisibleLayers((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
    console.log(`Layer ${id} is now ${isChecked ? "visible" : "hidden"}`)
  }

  if (!isMounted) {
    return (
      <div className="w-screen h-screen bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Carregando mapa...</span>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative z-10">
      <MapContainer center={center} zoom={zoom} zoomControl={false} className="w-full h-full">
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="&copy; Google"
        />

        {markers.map((marker, index) => (
          <Marker key={index} position={marker.position} icon={customIcon}>
            <Popup>
              <div>
                <h3 className="font-semibold text-lg">{marker.title}</h3>
                {marker.description && <p className="text-sm text-gray-600">{marker.description}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        <CustomZoomControl />
        <CustomLayerControl />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] gap-3 flex flex-col">
        <MapLayersCard title="Shapes" options={layerOptions} onLayerToggle={handleLayerToggle} />
        <MapLayersCard title="Ações" options={layerOptions} onLayerToggle={handleLayerToggle} />
      </div>
    </div>
  )
}

