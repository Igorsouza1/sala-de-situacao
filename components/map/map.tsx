"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Icon, type LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
import { MapLayersCard } from "./MapLayerCard"
import { useMapContext } from "@/context/GeoDataContext"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number
  markers?: Array<{
    position: LatLngExpression
    title: string
    description?: string
  }>
}

export default function Map({ center = [-21.327773, -56.694734], zoom = 11, markers = [] }: MapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<string[]>([])
  const { shapes, actions, isLoading, error } = useMapContext()

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

  if (!isMounted || isLoading) {
    return (
      <div className="w-screen h-screen bg-gray-100 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Carregando mapa...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
        <span className="text-red-500">Erro ao carregar o mapa: {error}</span>
      </div>
    )
  }

  const shapeOptions = Object.keys(shapes).map((category) => ({
    id: category,
    label: category,
    count: shapes[category].length,
  }))


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

        {visibleLayers.map((layerId) => {
          if (shapes[layerId]) {
            return (
              <GeoJSON
                key={layerId}
                data={{
                  type: "FeatureCollection",
                  features: shapes[layerId].map((shape) => ({
                    type: "Feature",
                    geometry: shape.geometry,
                    properties: { id: shape.id },
                  })),
                }}
              />
            )
          } 
          return null
        })}

        <CustomZoomControl />
        <CustomLayerControl />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] gap-3 flex flex-col">
        <MapLayersCard title="Shapes" options={shapeOptions} onLayerToggle={handleLayerToggle} />
      </div>
    </div>
  )
}

