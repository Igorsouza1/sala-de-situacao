"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
import { MapLayersCard } from "./MapLayerCard"
import { useMapContext } from "@/context/GeoDataContext"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number
}

const layerColors = {
  estradas: "white",
  bacia: "#33FF57",
  leito: "#3357FF",
  desmatamento: "yellow",
  propriedades: "green",
  firms: "red",
}

export default function Map({ center = [-21.327773, -56.694734], zoom = 11 }: MapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [visibleLayers, setVisibleLayers] = useState<string[]>([
    "estradas",
    "bacia",
    "leito",
    "desmatamento",
    "propriedades",
    "firms",
  ])
  const { mapData, isLoading, error } = useMapContext()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLayerToggle = (id: string, isChecked: boolean) => {
    setVisibleLayers((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
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

  const layerOptions = [
    { id: "estradas", label: "Estradas", count: mapData?.estradas.features.length || 0, color: layerColors.estradas },
    { id: "bacia", label: "Bacia", count: mapData?.bacia.features.length || 0, color: layerColors.bacia },
    { id: "leito", label: "Leito", count: mapData?.leito.features.length || 0, color: layerColors.leito },
    {
      id: "desmatamento",
      label: "Desmatamento",
      count: mapData?.desmatamento.features.length || 0,
      color: layerColors.desmatamento,
    },
    {
      id: "propriedades",
      label: "Propriedades",
      count: mapData?.propriedades.features.length || 0,
      color: layerColors.propriedades,
    },
    { id: "firms", label: "Focos de Incêndio", count: mapData?.firms.features.length || 0, color: layerColors.firms },
  ]

  return (
    <div className="w-full h-screen relative z-10">
      <MapContainer center={center} zoom={zoom} zoomControl={false} className="w-full h-full">
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="&copy; Google"
        />

        {mapData && visibleLayers.includes("estradas") && (
          <GeoJSON
            data={mapData.estradas}
            style={() => ({
              color: layerColors.estradas,
              weight: 4,
              opacity: 0.65,
            })}
          />
        )}
        {mapData && visibleLayers.includes("bacia") && (
          <GeoJSON
            data={mapData.bacia}
            style={() => ({
              color: layerColors.bacia,
              fillColor: layerColors.bacia,
              weight: 2,
              opacity: 0.65,
              fillOpacity: 0.2,
            })}
          />
        )}
        {mapData && visibleLayers.includes("leito") && (
          <GeoJSON
            data={mapData.leito}
            style={() => ({
              color: layerColors.leito,
              weight: 4,
              opacity: 0.65,
            })}
          />
        )}
        {mapData && visibleLayers.includes("desmatamento") && (
          <GeoJSON
            data={mapData.desmatamento}
            style={() => ({
              color: layerColors.desmatamento,
              fillColor: layerColors.desmatamento,
              weight: 2,
              opacity: 0.65,
              fillOpacity: 0.1,
            })}
          />
        )}
        {mapData && visibleLayers.includes("propriedades") && (
          <GeoJSON
            data={mapData.propriedades}
            style={() => ({
              color: "black",
              fillColor: layerColors.propriedades,
              weight: 2,
              opacity: 0.65,
              fillOpacity: 0.2,
            })}
          />
        )}
        {mapData &&
          visibleLayers.includes("firms") &&
          mapData.firms.features.map((firm, index) => (
            <CircleMarker
              key={`firm-${index}`}
              center={[firm.geometry.coordinates[1], firm.geometry.coordinates[0]]}
              radius={5}
              pathOptions={{
                color: layerColors.firms,
                fillColor: layerColors.firms,
                fillOpacity: 0.8,
              }}
            ></CircleMarker>
          ))}

        <CustomZoomControl />
        <CustomLayerControl />
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000] gap-3 flex flex-col">
        <MapLayersCard title="Camadas" options={layerOptions} onLayerToggle={handleLayerToggle} />
      </div>
    </div>
  )
}

