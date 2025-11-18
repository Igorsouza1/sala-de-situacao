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
// ✅ Importação do Hook
import { useMapFilters } from "@/hooks/useMapFilters"

// Imports Dinâmicos
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number
}

// --- Constantes de Cor ---
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
  "Não informado": "#7f8c8d",
}

// --- ✅ ESTILOS ESTÁTICOS (Mantido para evitar o erro de appendChild) ---
const STATIC_LAYER_STYLES = {
  bacia: {
    color: layerColors.bacia,
    fillColor: layerColors.bacia,
    weight: 2,
    opacity: 0.65,
    fillOpacity: 0.2,
  },
  banhado: {
    color: layerColors.banhado,
    fillColor: layerColors.banhado,
    weight: 2,
    opacity: 0.65,
    fillOpacity: 0.2,
  },
  propriedades: {
    color: "black",
    fillColor: layerColors.propriedades,
    weight: 2,
    opacity: 0.65,
    fillOpacity: 0.2,
  },
  leito: { color: layerColors.leito, weight: 4, opacity: 0.65 },
  estradas: { color: layerColors.estradas, weight: 4, opacity: 0.65 },
  desmatamento: {
    color: layerColors.desmatamento,
    fillColor: layerColors.desmatamento,
    weight: 2,
    opacity: 0.65,
    fillOpacity: 0.1,
  },
  expedicoes: { color: layerColors.expedicoes, weight: 3, opacity: 0.8 },
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
  const [visibleActions, setVisibleActions] = useState<string[]>([])
  
  const { mapData, isLoading, error, modalData, openModal, closeModal, dateFilter, setDateFilter, expedicoesData, refreshAcoesData, acoesData } =
    useMapContext()

  // ✅ HOOK: Recupera dados filtrados e memoizados (Limpeza de código)
  const {
    filteredDesmatamentoData,
    filteredFirms,
    filteredAcoes,
    actionOptions
  } = useMapFilters({ mapData, acoesData, expedicoesData, dateFilter });

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLayerToggle = (id: string, isChecked: boolean) => {
    setVisibleLayers((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
  }

  const handleActionToggle = (id: string, isChecked: boolean) => {
    setVisibleActions((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
  }

  // Modal e Permissões
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

  // ✅ layerConfigs usando estilos estáticos
  const layerConfigs = useMemo(
    () =>
      mapData
        ? [
            { id: "bacia", data: mapData.bacia, style: STATIC_LAYER_STYLES.bacia },
            { id: "banhado", data: mapData.banhado, style: STATIC_LAYER_STYLES.banhado },
            { id: "propriedades", data: mapData.propriedades, style: STATIC_LAYER_STYLES.propriedades },
            { id: "leito", data: mapData.leito, style: STATIC_LAYER_STYLES.leito },
            { id: "estradas", data: mapData.estradas, style: STATIC_LAYER_STYLES.estradas },
          ]
        : [],
    [mapData],
  )

  const layerOptions = [
    { id: "bacia", label: "Bacia", count: mapData?.bacia.features.length || 0, color: layerColors.bacia },
    { id: "banhado", label: "Banhado", count: mapData?.banhado.features.length || 0, color: layerColors.banhado },
    { id: "propriedades", label: "Propriedades", count: mapData?.propriedades.features.length || 0, color: layerColors.propriedades },
    { id: "leito", label: "Leito", count: mapData?.leito.features.length || 0, color: layerColors.leito },
    { id: "estradas", label: "Estradas", count: mapData?.estradas.features.length || 0, color: layerColors.estradas },
    { id: "desmatamento", label: "Desmatamento", count: mapData?.desmatamento.features.length || 0, color: layerColors.desmatamento },
    { id: "firms", label: "Focos de Incêndio", count: mapData?.firms.features.length || 0, color: layerColors.firms },
  ]

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
    // ✅ CSS ORIGINAL MANTIDO: Isso garante que o layout não quebre o header/sidebar
    <div className="w-full h-screen relative z-10">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        zoomControl={false} 
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          attribution="&copy; Google"
        />
        <CustomZoomControl />
        <CustomLayerControl />

        {/* Camadas Estáticas */}
        {layerConfigs.map(
          (layer) =>
            visibleLayers.includes(layer.id) && (
              <GeoJSON
                key={layer.id}
                data={layer.data}
                style={layer.style} // ✅ Estilo Estável
                onEachFeature={(feature, l) => {
                  l.on({
                    click: () => handleFeatureClick(feature.properties, layer.id),
                  })
                }}
              />
            ),
        )}

        {/* Desmatamento */}
        {filteredDesmatamentoData && visibleLayers.includes("desmatamento") && (
          <GeoJSON
            // A chave continua usando data para forçar refresh apenas quando filtro muda
            key={`desmatamento-${dateFilter.startDate?.toISOString()}-${dateFilter.endDate?.toISOString()}`}
            data={filteredDesmatamentoData}
            style={STATIC_LAYER_STYLES.desmatamento} // ✅ Estilo Estável
            onEachFeature={(feature, layer) => {
              layer.on({
                click: () => handleFeatureClick(feature.properties, "desmatamento"),
              })
            }}
          />
        )}

        {/* Focos de Incêndio */}
        {visibleLayers.includes("firms") &&
          filteredFirms.map((firm, index) => {
            // ✅ BLINDAGEM DE DADOS: Uso de Optional Chaining (?.)
            const coords = firm.geometry?.coordinates
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

        {/* Ações */}
        {filteredAcoes &&
          Object.entries(filteredAcoes).map(([acao, fc]) =>
            visibleActions.includes(acao) &&
            fc.features.map((feature, index) => {
              // ✅ BLINDAGEM DE DADOS: Uso de Optional Chaining (?.)
              const coords = feature.geometry?.coordinates as number[] | undefined
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

        {/* Expedições - Trilhas (Mantido filtragem manual pois estrutura pode variar) */}
        {expedicoesData && visibleActions.includes("expedicoes") && (
          <GeoJSON
            key={`expedicoes-${dateFilter.startDate?.toISOString() ?? "null"}-${dateFilter.endDate?.toISOString() ?? "null"}`}
            data={{
              type: "FeatureCollection",
              features: expedicoesData.trilhas.features.filter((f) => {
                // Importante importar isDatePropWithinRange no topo ou usar lógica local se preferir não importar o helper
                const d = f.properties.data ?? f.properties.recordedat ?? f.properties.created_at
                // Aqui estou assumindo que o helper foi importado, senão recrie a lógica simples:
                const itemDate = new Date(d)
                if (dateFilter.startDate && itemDate < dateFilter.startDate) return false
                if (dateFilter.endDate) {
                    const end = new Date(dateFilter.endDate)
                    end.setHours(23, 59, 59, 999)
                    if (itemDate > end) return false
                }
                return true
              }),
            } as any}
            style={STATIC_LAYER_STYLES.expedicoes} // ✅ Estilo Estável
            onEachFeature={(feature, layer) => {
              layer.on({ click: () => handleFeatureClick(feature.properties, "expedicoes") })
            }}
          />
        )}

        {/* Expedições - Waypoints */}
        {expedicoesData &&
          visibleActions.includes("expedicoes") &&
          [...expedicoesData.waypoints.features]
            .filter((wp) => {
                const d = wp.properties.data
                const itemDate = new Date(d)
                if (dateFilter.startDate && itemDate < dateFilter.startDate) return false
                if (dateFilter.endDate) {
                    const end = new Date(dateFilter.endDate)
                    end.setHours(23, 59, 59, 999)
                    if (itemDate > end) return false
                }
                return true
            })
            .sort((a, b) => new Date(a.properties.recordedat).getTime() - new Date(b.properties.recordedat).getTime())
            .map((wp, index) => {
              // ✅ BLINDAGEM DE DADOS: Uso de Optional Chaining (?.)
              const coords = wp.geometry?.coordinates as number[] | undefined
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
  )
}