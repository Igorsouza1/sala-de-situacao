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
import { useMapFilters } from "@/hooks/useMapFilters"
import { ACTION_CATEGORIES, ActionCategory, STATUS_STYLES, ActionStatus } from "./config/actions-config"
import { renderToStaticMarkup } from "react-dom/server"

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

// --- ESTILOS ESTÁTICOS ---
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

// Helper to create Action Icon
const createActionIcon = (category: ActionCategory, status: ActionStatus) => {
  const config = ACTION_CATEGORIES[category] || ACTION_CATEGORIES['Monitoramento'];
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES['Ativo'];
  const IconComponent = config.icon;
  
  const iconHtml = renderToStaticMarkup(
    <IconComponent 
      size={16} 
      color="white" 
      strokeWidth={2.5}
    />
  );

  // Extract border color from status class or map it manually if needed
  // For simplicity, we use the category color for background and status style for border/effect
  // Since we can't easily parse tailwind classes in JS for L.divIcon styles without a parser,
  // we will use inline styles that approximate the status styles.
  
  let borderColor = 'white';
  let borderStyle = 'solid';
  let animation = '';

  if (status === 'Monitorando') borderColor = '#eab308'; // yellow-500
  if (status === 'Resolvido') borderColor = '#22c55e'; // green-500
  if (status === 'Crítico') {
    borderColor = '#dc2626'; // red-600
    // animation = '...'; // CSS animation would need a global class
  }

  return L.divIcon({
    html: `
      <div style="
        background-color: ${config.color};
        border: 2px ${borderStyle} ${borderColor};
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${status === 'Resolvido' ? 'opacity: 0.7; filter: grayscale(0.5);' : ''}
      ">
        ${iconHtml}
      </div>
    `,
    className: `action-marker-${category} ${status === 'Crítico' ? 'animate-pulse' : ''}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

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
  
  // New Visibility State: Array of "Category:Type" strings
  const [visibleActionTypes, setVisibleActionTypes] = useState<string[]>([])
  
  const { mapData, isLoading, error, modalData, openModal, closeModal, dateFilter, setDateFilter, expedicoesData, refreshAcoesData, acoesData } =
    useMapContext()

  // ✅ HOOK: Recupera dados filtrados e agrupados
  const {
    filteredDesmatamentoData,
    filteredFirms,
    filteredAcoesFeatures,
    groupedActions
  } = useMapFilters({ mapData, acoesData, expedicoesData, dateFilter });

  useEffect(() => {
    setIsMounted(true)
  }, [])

  

  const handleLayerToggle = (id: string, isChecked: boolean) => {
    setVisibleLayers((prev) => (isChecked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
  }

  // Toggle a specific Type within a Category
  const handleActionTypeToggle = (categoryId: string, typeId: string, isChecked: boolean) => {
    const uniqueId = `${categoryId}:${typeId}`
    setVisibleActionTypes(prev => 
      isChecked ? [...prev, uniqueId] : prev.filter(id => id !== uniqueId)
    )
  }

  // Toggle all types within a Category
  const handleCategoryToggle = (categoryId: string, isChecked: boolean) => {
    const category = groupedActions.find(c => c.id === categoryId)
    if (!category) return

    const allTypeIds = category.types.map(t => `${categoryId}:${t.id}`)
    
    setVisibleActionTypes(prev => {
      const withoutCategory = prev.filter(id => !id.startsWith(`${categoryId}:`))
      return isChecked ? [...withoutCategory, ...allTypeIds] : withoutCategory
    })
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
                style={layer.style}
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
            key={`desmatamento-${dateFilter.startDate?.toISOString()}-${dateFilter.endDate?.toISOString()}`}
            data={filteredDesmatamentoData}
            style={STATIC_LAYER_STYLES.desmatamento}
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

        {/* Ações (Refatorado) */}
        {filteredAcoesFeatures.map((feature, index) => {
          const cat = (feature.properties.categoria as ActionCategory) || 'Monitoramento';
          const type = feature.properties.tipo || 'Outros';
          const uniqueId = `${cat}:${type}`;
          const status = (feature.properties.status as ActionStatus) || 'Ativo';

          if (!visibleActionTypes.includes(uniqueId)) return null;

          const coords = feature.geometry?.coordinates as number[] | undefined;
          if (Array.isArray(coords) && coords.length >= 2) {
            return (
              <Marker
                key={`acao-${feature.properties.id || index}`}
                position={[coords[1], coords[0]]}
                icon={createActionIcon(cat, status)}
                eventHandlers={{
                  click: () => handleFeatureClick({ ...feature.properties, id: feature.properties.id }, "acoes"),
                }}
              >
                <Tooltip>{feature.properties.name || feature.properties.nome}</Tooltip>
              </Marker>
            );
          }
          return null;
        })}

        {/* Expedições - Trilhas */}
        {expedicoesData && visibleLayers.includes("expedicoes") && (
          <GeoJSON
            key={`expedicoes-${dateFilter.startDate?.toISOString() ?? "null"}-${dateFilter.endDate?.toISOString() ?? "null"}`}
            data={{
              type: "FeatureCollection",
              features: expedicoesData.trilhas.features.filter((f) => {
                const d = f.properties.data ?? f.properties.recordedat ?? f.properties.created_at
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
            style={STATIC_LAYER_STYLES.expedicoes}
            onEachFeature={(feature, layer) => {
              layer.on({ click: () => handleFeatureClick(feature.properties, "expedicoes") })
            }}
          />
        )}

        {/* Expedições - Waypoints */}
        {expedicoesData &&
          visibleLayers.includes("expedicoes") &&
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
        <ActionsLayerCard 
          title="Ações" 
          categories={groupedActions} 
          visibleActionTypes={visibleActionTypes}
          onToggleType={handleActionTypeToggle}
          onToggleCategory={handleCategoryToggle}
        />
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