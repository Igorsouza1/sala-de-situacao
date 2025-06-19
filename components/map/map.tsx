"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
import { MapLayersCard } from "./MapLayerCard"
import { MapPlaceholder } from "./MapPlaceholder"
import { DateFilterControl } from "./DateFilterControl"
import { useMapContext } from "@/context/GeoDataContext"

import { Modal } from "./Modal"
import type React from "react"
import { Grid } from "@/components/ui/grid"
import type { Feature, Geometry, GeoJsonProperties } from "geojson"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number
}

const layerColors = {
  estradas: "#FFFFF0",
  bacia: "#33FF57",
  leito: "#3357FF",
  desmatamento: "yellow",
  propriedades: "green",
  firms: "red",
  banhado: "darkblue",
}


type GeoJSONFeatureCollection = {
  type: "FeatureCollection"
  features: Feature<Geometry, GeoJsonProperties>[]
}

type MapData = {
  bacia: GeoJSONFeatureCollection
  banhado: GeoJSONFeatureCollection
  propriedades: GeoJSONFeatureCollection
  leito: GeoJSONFeatureCollection
  estradas: GeoJSONFeatureCollection
  desmatamento: GeoJSONFeatureCollection
  firms: GeoJSONFeatureCollection
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
    "banhado",
  ])
  const { mapData, isLoading, error, modalData, openModal, closeModal, dateFilter, setDateFilter } =
    useMapContext()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    //Removed console.log
  }, [])

  const handleLayerToggle = (id: string, isChecked: boolean) => {
    setVisibleLayers((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
  }


  const handleFeatureClick = useCallback(
    (properties: Record<string, unknown>, layerType: string) => {
      const title = `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} Details`
      const content = (
        <Grid className="grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(properties).map(([key, value]) => (
            <div key={key} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{key}</h3>
              <p className="text-base break-words">{String(value)}</p>
            </div>
          ))}
        </Grid>
      )
      openModal(title, content)
    },
    [openModal],
  )

  const isWithinDateRange = (date: string, startDate: Date | null, endDate: Date | null) => {
    const itemDate = new Date(date)
    if (startDate && itemDate < startDate) return false
    if (endDate) {
      const adjustedEndDate = new Date(endDate)
      adjustedEndDate.setHours(23, 59, 59, 999)
      if (itemDate > adjustedEndDate) return false
    }
    return true
  }

  const filteredDesmatamentoData = useMemo(() => {
    if (mapData && mapData.desmatamento) {
      return {
        type: "FeatureCollection",
        features: mapData.desmatamento.features.filter((feature) =>
          isWithinDateRange(feature.properties.detectat, dateFilter.startDate, dateFilter.endDate),
        ),
      } as GeoJSONFeatureCollection
    }
    return null
  }, [mapData, dateFilter.startDate, dateFilter.endDate, isWithinDateRange])

  if (!isMounted || isLoading) {
    return <MapPlaceholder />
  }

  if (error) {
    return (
      <div className="w-screen h-screen bg-gray-100 flex items-center justify-center">
        <span className="text-red-500">Erro ao carregar o mapa: {error}</span>
      </div>
    )
  }

  const layerOptions = [
    { id: "bacia", label: "Bacia", count: mapData?.bacia.features.length || 0, color: layerColors.bacia },
    { id: "banhado", label: "Banhado", count: mapData?.banhado.features.length || 0, color: layerColors.banhado },
    {
      id: "propriedades",
      label: "Propriedades",
      count: mapData?.propriedades.features.length || 0,
      color: layerColors.propriedades,
    },
    { id: "leito", label: "Leito", count: mapData?.leito.features.length || 0, color: layerColors.leito },
    { id: "estradas", label: "Estradas", count: mapData?.estradas.features.length || 0, color: layerColors.estradas },
    {
      id: "desmatamento",
      label: "Desmatamento",
      count: mapData?.desmatamento.features.length || 0,
      color: layerColors.desmatamento,
    },
    { id: "firms", label: "Focos de Incêndio", count: mapData?.firms.features.length || 0, color: layerColors.firms },
  ]

  const layerConfigs = useMemo(
    () =>
      mapData
        ? [
            {
              id: "bacia",
              data: mapData.bacia,
              style: { color: layerColors.bacia, fillColor: layerColors.bacia, weight: 2, opacity: 0.65, fillOpacity: 0.2 },
            },
            {
              id: "banhado",
              data: mapData.banhado,
              style: { color: layerColors.banhado, fillColor: layerColors.banhado, weight: 2, opacity: 0.65, fillOpacity: 0.2 },
            },
            {
              id: "propriedades",
              data: mapData.propriedades,
              style: { color: "black", fillColor: layerColors.propriedades, weight: 2, opacity: 0.65, fillOpacity: 0.2 },
            },
            {
              id: "leito",
              data: mapData.leito,
              style: { color: layerColors.leito, weight: 4, opacity: 0.65 },
            },
            {
              id: "estradas",
              data: mapData.estradas,
              style: { color: layerColors.estradas, weight: 4, opacity: 0.65 },
            },
          ]
        : [],
    [mapData],
  )

  const filteredFirms = useMemo(() => {
    if (!mapData) return []
    return mapData.firms.features.filter((firm) =>
      isWithinDateRange(firm.properties.acq_date, dateFilter.startDate, dateFilter.endDate),
    )
  }, [mapData, dateFilter.startDate, dateFilter.endDate])


  return (
    <div className="w-full h-screen relative z-10">
      <MapContainer center={center} zoom={zoom} zoomControl={false} className="w-full h-full">
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="&copy; Google"
        />
        <CustomZoomControl  />
        <CustomLayerControl  />

        {layerConfigs.map(
          (layer) =>
            visibleLayers.includes(layer.id) && (
              <GeoJSON
                key={layer.id}
                data={layer.data}
                style={() => layer.style}
                onEachFeature={(feature, l) => {
                  l.on({
                    click: () => handleFeatureClick(feature.properties, layer.id),
                  })
                }}
              />
            ),
        )}
        {filteredDesmatamentoData && visibleLayers.includes("desmatamento") && (
          <GeoJSON
            key={`desmatamento-${dateFilter.startDate?.toISOString()}-${dateFilter.endDate?.toISOString()}`}
            data={filteredDesmatamentoData}
            style={() => ({
              color: layerColors.desmatamento,
              fillColor: layerColors.desmatamento,
              weight: 2,
              opacity: 0.65,
              fillOpacity: 0.1,
            })}
            onEachFeature={(feature, layer) => {
              layer.on({
                click: () => handleFeatureClick(feature.properties, "desmatamento"),
              })
            }}
          />
        )}
        {visibleLayers.includes("firms") &&
          filteredFirms.map((firm, index) => {
            const coords = firm.geometry.coordinates
            if (
              Array.isArray(coords) &&
              coords.length === 2 &&
              typeof coords[0] === "number" &&
              typeof coords[1] === "number"
            ) {
              return (
                <CircleMarker
                  key={`firm-${index}`}
                  center={[coords[1], coords[0]]}
                  radius={5}
                  pathOptions={{
                    color: layerColors.firms,
                    fillColor: layerColors.firms,
                    fillOpacity: 0.8,
                  }}
                  eventHandlers={{
                    click: () => handleFeatureClick(firm.properties, "firms"),
                  }}
                />
              )
            }
            return null
          })}

      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000]">
        <DateFilterControl onDateChange={setDateFilter} />
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] gap-3 flex flex-col">
        <MapLayersCard title="Camadas" options={layerOptions} onLayerToggle={handleLayerToggle} />
      </div>

      <Modal isOpen={modalData.isOpen} onClose={closeModal} title={modalData.title}>
        {modalData.content}
      </Modal>
    </div>
  )
}

