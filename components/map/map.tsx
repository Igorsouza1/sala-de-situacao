"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
import { MapLayersCard } from "./MapLayerCard"
import { ActionsLayerCard } from "./ActionLayerCard"
import { MapPlaceholder } from "./MapPlaceholder"
import { DateFilterControl } from "./DateFilterControl"
import { useMapContext } from "@/context/GeoDataContext"
import L from "leaflet"
import { FeatureDetails } from "./feature-details"
import { Modal } from "./Modal"
import { EditAcaoModal } from "./EditAcaoModal"
import { useUserRole } from "@/hooks/useUserRole"
import { acoesInRioDaPrata } from "@/db/schema"
import { InferSelectModel } from "drizzle-orm"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number
  acoesProps: Record<string, GeoJSONFeatureCollection>
}

const layerColors = {
  estradas: "#FFFFF0",
  bacia: "#33FF57",
  leito: "#3357FF",
  desmatamento: "yellow",
  propriedades: "green",
  firms: "red",
  banhado: "darkblue",
  expedicoes: "orange",
}

const actionColors: Record<string, string> = {
  "Fazenda": "#2ecc71",
  "Passivo Ambiental": "#f1c40f",
  Pesca: "#3498db",
  "Pesca - Crime Ambiental": "#9b59b6",
  "Ponto de Referência": "#e67e22",
  "Crime Ambiental": "#e74c3c",
  Nascente: "#1abc9c",
  Plantio: "#16a085",
  "Régua Fluvial": "#95a5a6",
  expedicoes: "orange",
}

type GeoJSONFeature = {
  type: "Feature"
  properties: { [key: string]: any }
  geometry: { type: string; coordinates: number[] | number[][] | number[][][] }
}

type GeoJSONFeatureCollection = {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

const createWaypointIcon = (index: number) =>
  L.divIcon({
    html: `
      <div style="
        background: rgba(255, 165, 0, 0.85);
        color: white;
        border: 2px solid white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 0 4px rgba(0,0,0,0.5);
      ">
        ${index}
      </div>
    `,
    className: "waypoint-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })

export default function Map({ center = [-21.327773, -56.694734], zoom = 11 , acoesProps}: MapProps) {
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
  const [visibleActions, setVisibleActions] = useState<string[]>([])
  const { mapData, isLoading, error, modalData, openModal, closeModal, dateFilter, setDateFilter, expedicoesData, refreshAcoesData } =
    useMapContext()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLayerToggle = (id: string, isChecked: boolean) => {
    setVisibleLayers((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
  }

  const handleActionToggle = (id: string, isChecked: boolean) => {
    setVisibleActions((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
  }

  // Modal de detalhes do feature
  const [selectedAcao, setSelectedAcao] = useState<any | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const { isAdmin } = useUserRole()

  const handleFeatureClick = useCallback(
    (properties: Record<string, unknown>, layerType: string) => {
      if (layerType === "acoes") {
        setSelectedAcao(properties)
      } else {
        setSelectedAcao(null)
      }
      const content = <FeatureDetails layerType={layerType} properties={properties} />
      openModal("", content)
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
  }, [mapData, dateFilter.startDate, dateFilter.endDate])

  const layerConfigs = useMemo(
    () =>
      mapData
        ? [
            {
              id: "bacia",
              data: mapData.bacia,
              style: {
                color: layerColors.bacia,
                fillColor: layerColors.bacia,
                weight: 2,
                opacity: 0.65,
                fillOpacity: 0.2,
              },
            },
            {
              id: "banhado",
              data: mapData.banhado,
              style: {
                color: layerColors.banhado,
                fillColor: layerColors.banhado,
                weight: 2,
                opacity: 0.65,
                fillOpacity: 0.2,
              },
            },
            {
              id: "propriedades",
              data: mapData.propriedades,
              style: {
                color: "black",
                fillColor: layerColors.propriedades,
                weight: 2,
                opacity: 0.65,
                fillOpacity: 0.2,
              },
            },
            { id: "leito", data: mapData.leito, style: { color: layerColors.leito, weight: 4, opacity: 0.65 } },
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

  const filteredAcoes = useMemo(() => {
    const newResult: Record<string, GeoJSONFeatureCollection> = {};
    if (!acoesProps) {
      return newResult;
    }
  
    // Usamos Object.entries para pegar a chave (acaoType) e o valor (featureCollection)
    Object.entries(acoesProps).forEach(([acaoType, featureCollection]) => {
      // 1. Pula o grupo de ações que a API retornou como "null" ou dados inválidos
      if (acaoType === 'null' || !featureCollection || !featureCollection.features) {
        return; // 'continue' para o próximo item do loop
      }
  
      // 2. Filtra os features DENTRO da coleção apenas pela data
      const filteredFeatures = featureCollection.features.filter(feature => {
        // Verificação de segurança para garantir que a propriedade 'time' existe
        if (!feature.properties || !feature.properties.time) {
          return false;
        }
        return isWithinDateRange(feature.properties.time, dateFilter.startDate, dateFilter.endDate);
      });
  
      // 3. Só adiciona ao resultado se houver features após o filtro de data
      if (filteredFeatures.length > 0) {
        newResult[acaoType] = {
          ...featureCollection, // Mantém o 'type' e outras propriedades da coleção
          features: filteredFeatures,
        };
      }
    });
  
    return newResult;
  }, [acoesProps, dateFilter.startDate, dateFilter.endDate]); // A dependência de isWithinDateRange não é necessária

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

  const actionOptions = useMemo(() => {
    const opts: { id: string; label: string; count: number; color: string }[] = []
    
    if (expedicoesData) {
      opts.push({ id: "expedicoes", label: "Expedições", count: expedicoesData.trilhas.features.length, color: actionColors.expedicoes })
    }
    if (filteredAcoes) {
      Object.entries(filteredAcoes).forEach(([acao, fc]) => {
        opts.push({ id: acao, label: acao, count: fc.features.length, color: actionColors[acao] || "#000" })
      })
    }
    return opts
  }, [filteredAcoes, expedicoesData])

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

  return (
    <div className="w-full h-screen relative z-10">
      <MapContainer center={center} zoom={zoom} zoomControl={false} className="w-full h-full">
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="&copy; Google"
        />
        <CustomZoomControl />
        <CustomLayerControl />

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

                >
                  <Tooltip>
                    {firm.properties.acq_date
                      ? new Intl.DateTimeFormat('pt-BR').format(new Date(firm.properties.acq_date))
                      : firm.properties.nome}
                  </Tooltip>
                </CircleMarker>
              )
            }
            return null
          })}

        {filteredAcoes &&
          Object.entries(filteredAcoes).map(([acao, fc]) =>
            visibleActions.includes(acao) &&
            fc.features.map((feature, index) => {
              const coords = feature.geometry.coordinates as number[]
              if (Array.isArray(coords) && coords.length >= 2) {
                return (
                  <CircleMarker
                    key={`acao-${acao}-${index}`}
                    center={[coords[1], coords[0]]}
                    radius={6}
                    pathOptions={{
                      color: actionColors[acao],
                      fillColor: actionColors[acao],
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => handleFeatureClick({ ...feature.properties, id: feature.properties.id }, "acoes"),
                    }}
                    >
                    <Tooltip>{feature.properties.name || feature.properties.nome}</Tooltip>
                  </CircleMarker>
                )
              }
              return null
            }),
          )}

        {expedicoesData && visibleActions.includes("expedicoes") && (
          <GeoJSON
            data={
              {
                type: "FeatureCollection",
                features: expedicoesData.trilhas.features.filter((feature) =>
                  isWithinDateRange(feature.properties.data, dateFilter.startDate, dateFilter.endDate),
                ),
              } as any
            }
            style={() => ({
              color: layerColors.expedicoes,
              weight: 3,
              opacity: 0.8,
            })}
            onEachFeature={(feature, layer) => {
              layer.on({
                click: () => handleFeatureClick(feature.properties, "expedicoes"),
              })
            }}
          />
        )}

{expedicoesData &&
  visibleActions.includes("expedicoes") &&
  [...expedicoesData.waypoints.features]
    .filter((wp) => isWithinDateRange(wp.properties.data, dateFilter.startDate, dateFilter.endDate))
    .sort((a, b) => new Date(a.properties.recordedat).getTime() - new Date(b.properties.recordedat).getTime())
    .map((wp, index) => {
      const coords = wp.geometry.coordinates as number[]
      if (Array.isArray(coords) && coords.length >= 2) {
        return (
          <Marker
            key={`exp-wp-${index}`}
            position={[coords[1], coords[0]]}
            icon={createWaypointIcon(index + 1)}
            eventHandlers={{
              click: () => handleFeatureClick(wp.properties, "expedicoes"),
            }}
            >
            <Tooltip>{wp.properties.name || wp.properties.nome}</Tooltip>
          </Marker>
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
        <ActionsLayerCard title="Ações" options={actionOptions} onLayerToggle={handleActionToggle} />
      </div>

      <Modal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        showEdit={isAdmin && !!selectedAcao}
        onEdit={() => setIsEditOpen(true)}
      >
        {modalData.content}
      </Modal>
      <EditAcaoModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        acao={selectedAcao}
        onSave={async (data, files) => {
          const form = new FormData()
          Object.entries(data).forEach(([k, v]) => form.append(k, String(v)))
          files.forEach(f => form.append("files", f))
          await fetch(`/api/acoes/${data.id}`, { method: "PUT", body: form })
          await refreshAcoesData()
          setIsEditOpen(false)
          closeModal()
        }}
      />
    </div>
  )}