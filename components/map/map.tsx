"use client"

import { ChevronUp, ChevronDown, Layers, Eye, EyeOff, Leaf, Flame, Waves, MapPin, Activity } from "lucide-react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
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
  
  // New Visibility State: Array of "Category:Type" strings (REMOVED)
  const [dynamicLayers, setDynamicLayers] = useState<LayerResponseDTO[]>([])
  const [visibleDynamicLayers, setVisibleDynamicLayers] = useState<string[]>([])
  const [loadingLayers, setLoadingLayers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)
  
  const { modalData, openModal, closeModal, dateFilter, setDateFilter } =
    useMapContext()

  // Fetch Dynamic Layers (Moved directly to map component for reuse)
  const fetchLayers = useCallback(async () => {
    setLoadingLayers(true)
    setError(null)
    try {
      const response = await fetch("/api/map/layers")
      if (response.ok) {
        const data: LayerResponseDTO[] = await response.json()
        setDynamicLayers(data.sort((a,b) => (a.ordering || 0) - (b.ordering || 0)))
      } else {
          console.error("Failed to fetch layers")
          setError("Falha ao carregar camadas")
      }
    } catch (err) {
      console.error("Error fetching layers:", err)
      setError("Erro ao conectar com servidor")
    } finally {
      setLoadingLayers(false)
    }
  }, []) 

  // Initialize visibility once
  useEffect(() => {
    if (!initializedRef.current && dynamicLayers.length > 0) {
        setVisibleDynamicLayers(dynamicLayers.map(l => l.slug))
        initializedRef.current = true
    }
  }, [dynamicLayers])

  useEffect(() => {
    setIsMounted(true)
    fetchLayers()
  }, [fetchLayers])


  


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

  // Legacy layerConfigs and layerOptions removed

  const dynamicLayerOptions: LayerManagerOption[] = dynamicLayers.map(layer => ({
    id: String(layer.id),
    label: layer.name,
    slug: layer.slug,
    count: layer.data?.features?.length || 0,
    color: layer.visualConfig?.color || "#cccccc" 
  }))

  if (!isMounted || loadingLayers) {
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

        {/* Legacy Manual Layers Removed */}

        {/* Camadas Dinâmicas Unificadas */}
        {dynamicLayers.map(layer => {
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
                 const dateVal = p.data || p.date || p.created_at || p.alert_date || p.acq_date || p.recordedat || p.detectat || p.time;
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
                 const dateA = new Date(pA.data || pA.date || pA.created_at || pA.alert_date || pA.acq_date || pA.detectat || pA.time || 0);
                 const dateB = new Date(pB.data || pB.date || pB.created_at || pB.alert_date || pB.acq_date || pB.detectat || pB.time || 0);
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
          await fetchLayers()
          setIsEditOpen(false)
          closeModal()
        }}
      />
    </div>
  )
}