"use client"

import { ChevronUp, ChevronDown, Layers, Eye, EyeOff, Leaf, Flame, Waves, MapPin, Activity } from "lucide-react"
import { useEffect, useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import type { LatLngExpression } from "leaflet"
import "leaflet/dist/leaflet.css"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
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
import { LayerManager, LayerManagerOption } from "./LayerManager"
import { LayerResponseDTO } from "@/types/map-dto"


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


const createCustomIcon = (iconName: string, color: string) => {
  let IconComponent = MapPin;

  // Simple mapping for defaults or configured names
  // In a real generic system, this mapping might be larger or dynamic
  if (iconName === 'flame' || iconName === 'fire') IconComponent = Flame;
  if (iconName === 'waves' || iconName === 'water') IconComponent = Waves;
  if (iconName === 'activity') IconComponent = Activity;
  if (iconName === 'leaf') IconComponent = Leaf;

  const iconHtml = renderToStaticMarkup(
    <div style={{
        backgroundColor: color,
        borderRadius: '50%',
        padding: '6px',
        border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
      <IconComponent size={16} color="white" strokeWidth={2.5} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-map-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// --- HELPER DE ESTILIZAÇÃO DINÂMICA ---
const getLayerStyle = (visualConfig: LayerResponseDTO['visualConfig']) => {
  if (!visualConfig) return {};
  
  return {
    color: visualConfig.mapMarker?.color || visualConfig.color || '#3388ff',
    fillColor: visualConfig.mapMarker?.fillColor || visualConfig.fillColor || '#3388ff',
    weight: visualConfig.mapMarker?.weight || visualConfig.weight || 2,
    opacity: visualConfig.mapMarker?.opacity || visualConfig.opacity || 1,
    fillOpacity: visualConfig.mapMarker?.fillOpacity || visualConfig.fillOpacity || 0.2,
  };
};

const getPointToLayer = (visualConfig: LayerResponseDTO['visualConfig'], slug: string) => {
  return (feature: any, latlng: L.LatLng) => {
    // 1. Check for Configured Icon or Default Slug Icons
    const color = visualConfig?.color || '#3388ff';
    
    // Explicit Config
    if (visualConfig?.icon) {
        return L.marker(latlng, { icon: createCustomIcon(visualConfig.icon, color) });
    }

    // Default Fallbacks (The "Rules")
    if (slug === 'firms') {
        return L.marker(latlng, { icon: createCustomIcon('flame', '#ef4444') }); // Red Flame
    }
    if (slug === 'deque-de-pedras' || slug === 'ponte-do-cure') {
        return L.marker(latlng, { icon: createCustomIcon('waves', '#0ea5e9') }); // Blue Waves
    }
    if (slug === 'acoes') { // Fallback if it enters the generic loop
        return L.marker(latlng, { icon: createCustomIcon('activity', '#22c55e') }); 
    }


    // 2. Default Shapes
    const markerType = visualConfig?.mapMarker?.type || 'circle';
    const style = getLayerStyle(visualConfig);

    if (markerType === 'circle') {
      return L.circleMarker(latlng, {
        ...style,
        radius: visualConfig?.mapMarker?.radius || 6
      });
    }
    
    // Default marker (Leaflet Pin)
    return L.marker(latlng);
  }
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
  const statusConfig = STATUS_STYLES[status] || STATUS_STYLES['Ativo'];
  const IconComponent = config.icon;
  
  // Colors
  // If resolved, use a muted gray for the main pin to indicate inactivity, but keep the badge green
  const mainColor = status === 'Resolvido' ? '#64748b' : config.color; 
  const statusColor = statusConfig.color;

  const iconHtml = renderToStaticMarkup(
    <IconComponent 
      size={18} 
      color="white" 
      strokeWidth={2.5}
    />
  );

  // SVG Path for a Map Pin (FontAwesome style)
  // ViewBox 0 0 384 512
  const pinPath = "M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z";

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 40px;
        height: 48px;
        filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
        transition: all 0.2s ease;
      " class="group hover:-translate-y-1">
        
        <!-- Main Pin -->
        <svg width="40" height="48" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
          <path fill="${mainColor}" d="${pinPath}"/>
          <circle cx="192" cy="192" r="90" fill="rgba(255,255,255,0.2)" />
        </svg>

        <!-- Icon -->
        <div style="
          position: absolute;
          top: 14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        ">
          ${iconHtml}
        </div>

        <!-- Status Badge -->
        <div style="
          position: absolute;
          top: 0;
          right: 0;
          width: 14px;
          height: 14px;
          background-color: ${statusColor};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 10;
        "></div>
      </div>
    `,
    className: `action-marker-${category} ${status === 'Crítico' ? 'animate-pulse' : ''}`,
    iconSize: [40, 48],
    iconAnchor: [20, 48], // Tip of the pin
    popupAnchor: [0, -48], // Above the pin
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
  const [dynamicLayers, setDynamicLayers] = useState<LayerResponseDTO[]>([])
  const [visibleDynamicLayers, setVisibleDynamicLayers] = useState<string[]>([])
  const [loadingLayers, setLoadingLayers] = useState(false)
  
  const { mapData, isLoading, error, modalData, openModal, closeModal, dateFilter, setDateFilter, expedicoesData, refreshAcoesData, acoesData } =
    useMapContext()

  // ✅ HOOK: Recupera dados filtrados e agrupados
  const {
    filteredAcoesFeatures,
    groupedActions
  } = useMapFilters({ mapData, acoesData, expedicoesData, dateFilter });

  useEffect(() => {
    setIsMounted(true)
    
    // Fetch Dynamic Layers
    const fetchLayers = async () => {
      setLoadingLayers(true)
      try {
        const response = await fetch("/api/map/layers")
        if (response.ok) {
          const data: LayerResponseDTO[] = await response.json()
      setDynamicLayers(data.sort((a,b) => (a.ordering || 0) - (b.ordering || 0)))
          // Default to all visible or logic based on requirements
          setVisibleDynamicLayers(data.map(l => l.slug))
        } else {
            console.error("Failed to fetch layers")
        }
      } catch (err) {
        console.error("Error fetching layers:", err)
      } finally {
        setLoadingLayers(false)
      }
    }
    fetchLayers()
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

  // Dynamic Layer Toggles
  const handleDynamicLayerToggle = (slug: string, isChecked: boolean) => {
    setVisibleDynamicLayers(prev => isChecked ? [...prev, slug] : prev.filter(s => s !== slug))
  }

  const handleToggleAllDynamic = (isChecked: boolean) => {
    setVisibleDynamicLayers(isChecked ? dynamicLayers.map(d => d.slug) : [])
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

  // Legacy layerConfigs removed

  const layerOptions = [
    { id: "bacia", label: "Bacia", count: mapData?.bacia.features.length || 0, color: layerColors.bacia },
    { id: "banhado", label: "Banhado", count: mapData?.banhado.features.length || 0, color: layerColors.banhado },
    { id: "propriedades", label: "Propriedades", count: mapData?.propriedades.features.length || 0, color: layerColors.propriedades },
    { id: "leito", label: "Leito", count: mapData?.leito.features.length || 0, color: layerColors.leito },
    { id: "estradas", label: "Estradas", count: mapData?.estradas.features.length || 0, color: layerColors.estradas },
    { id: "desmatamento", label: "Desmatamento", count: mapData?.desmatamento.features.length || 0, color: layerColors.desmatamento },
    { id: "firms", label: "Focos de Incêndio", count: mapData?.firms.features.length || 0, color: layerColors.firms },
  ]

  const dynamicLayerOptions: LayerManagerOption[] = dynamicLayers.map(layer => ({
    id: String(layer.id),
    label: layer.name,
    slug: layer.slug,
    count: layer.data?.features?.length || 0,
    color: layer.visualConfig?.color || "#cccccc" 
  }))

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

        {/* Legacy Manual Layers - Removido em favor do sistema dinâmico, mas mantendo código morto limpo */}
        {/* {layerConfigs.map ... } */} 

        {/* Legacy Desmatamento Block Removed - Now handled by dynamicLayers */ }

        {/* Legacy Firms Block Removed - Now handled by dynamicLayers */ }

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

        {/* Legacy Expedicoes Block Removed - Now handled by dynamicLayers */ }

        {/* Legacy Waypoints Block Removed */ }
        {/* Camadas Dinâmicas Unificadas */}
        {dynamicLayers.map(layer => {
          // Special Case: Ações is handled by a specialized block slightly above (Lines 381+)
          // We skip it here to avoid double rendering and loss of functionality
          if (layer.slug === 'acoes') return null;

          if (!visibleDynamicLayers.includes(layer.slug)) return null
          
          // Data Filtering Logic
          let displayData = layer.data;
          
          if (layer.visualConfig?.dateFilter && (dateFilter.startDate || dateFilter.endDate)) {
            // Find the date field - default to 'created_at' or specific fields known schema
             displayData = {
               ...layer.data,
               features: layer.data.features.filter(f => {
                 // Try common date fields
                 const p = f.properties as any;
                 const dateVal = p.data || p.date || p.created_at || p.alert_date || p.acq_date || p.recordedat;
                 if (!dateVal) return true; // Keep if no date found (safe default)
                 
                 const d = new Date(dateVal);
                 if (isNaN(d.getTime())) return true;

                 if (dateFilter.startDate && d < dateFilter.startDate) return false;
                 if (dateFilter.endDate) {
                     const end = new Date(dateFilter.endDate);
                     end.setHours(23, 59, 59, 999);
                     if (d > end) return false;
                 }
                 return true;
               })
             }
          }

          // 'latest' Logic: Keep only the single most recent feature
          // Useful for sensor data like 'deque-de-pedras' or 'ponte-do-cure'
          if (layer.visualConfig?.mapDisplay === 'latest') {
             const sorted = [...displayData.features].sort((a, b) => {
                 const pA = a.properties as any;
                 const pB = b.properties as any;
                 const dateA = new Date(pA.data || pA.date || pA.created_at || pA.alert_date || pA.acq_date || 0);
                 const dateB = new Date(pB.data || pB.date || pB.created_at || pB.alert_date || pB.acq_date || 0);
                 return dateB.getTime() - dateA.getTime();
             });
             displayData = {
                 ...displayData,
                 features: sorted.slice(0, 1) // Top 1
             };
          }

          return (
             <GeoJSON
                key={`${layer.slug}-${displayData.features.length}`} // Force re-render on filter change
                data={displayData}
                style={getLayerStyle(layer.visualConfig)}
                pointToLayer={getPointToLayer(layer.visualConfig, layer.slug)}
                onEachFeature={(feature, l) => {
                   // Bind Popup based on Schema Config
                   if (layer.schemaConfig?.fields?.length) {
                     const popupContent = `
                       <div class="p-2 min-w-[200px]">
                         <h3 class="font-bold mb-2 text-sm border-b pb-1">${layer.name}</h3>
                         <div class="space-y-1 text-xs">
                           ${layer.schemaConfig.fields.map(field => `
                             <div class="flex justify-between gap-4">
                               <span class="text-slate-500">${field.label}:</span>
                               <span class="font-medium text-slate-800">${feature.properties[field.key] ?? '-'}</span>
                             </div>
                           `).join('')}
                         </div>
                       </div>
                     `;
                     l.bindPopup(popupContent);
                   }

                   l.on({
                     click: () => handleFeatureClick(feature.properties, layer.slug),
                   })
                }}
              />
          )
        })}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[1000]">
        <DateFilterControl onDateChange={setDateFilter} />
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] gap-3 flex flex-col">
        {/* <MapLayersCard ... /> Removido */ }
       
        <LayerManager
            title="Camadas Disponíveis"
            options={dynamicLayerOptions}
            activeLayers={visibleDynamicLayers}
            onLayerToggle={handleDynamicLayerToggle}
            onToggleAll={handleToggleAllDynamic}
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