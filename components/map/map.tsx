"use client"

import {  Flame, Waves, MapPin } from "lucide-react"
import * as LucideIcons from "lucide-react"
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

interface MapProps {
  center?: LatLngExpression
  zoom?: number 
}

// Helper to convert kebab-case or snake_case to PascalCase (e.g., "map-pin" -> "MapPin")
const toPascalCase = (str: string) => {
  return str
    .replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    })
    .replace(/^./, (str) => str.toUpperCase());
};

// --- ESTILOS ESTÁTICOS ---

const createCustomIcon = (iconName: string, color: string) => {
  // 1. Normalize name to PascalCase to match Lucide exports
  const pascalName = toPascalCase(iconName);
  
  // 2. Dynamic Lookup
  // @ts-ignore - Dynamic access to Lucide icons
  let IconComponent = LucideIcons[pascalName];
  
  // 3. Fallback for specific legacy names not matching standard valid Lucide names directly if needed
  if (!IconComponent) {
      // Manual mapping for oddball cases or aliases
      if (iconName === 'water') IconComponent = Waves;
      if (iconName === 'fire') IconComponent = Flame;
  }

  // 4. Final Fallback
  if (!IconComponent) {
      console.warn(`Icon "${iconName}" (Pascal: "${pascalName}") not found in LucideIcons. Using default.`);
      IconComponent = MapPin;
  }

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
    if (visualConfig?.mapMarker?.icon) {
        return L.marker(latlng, { icon: createCustomIcon(visualConfig.mapMarker?.icon, color) });
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




export default function Map({ center = [-21.327773, -56.694734], zoom = 11 }: MapProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  const [dynamicLayers, setDynamicLayers] = useState<LayerResponseDTO[]>([])
  const [visibleDynamicLayers, setVisibleDynamicLayers] = useState<string[]>([])
  const [loadingLayers, setLoadingLayers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initializedRef = useRef(false)
  
  const { modalData, openModal, closeModal, dateFilter, setDateFilter } =
    useMapContext()

  // Fetch Dynamic Layers (Moved directly to map component for reuse)
  // ISSO NAO DEVIA ESTAR EM UM HOOK?
  const fetchLayers = useCallback(async () => {
    setLoadingLayers(true)
    setError(null)
    try {
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate.toISOString());
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate.toISOString());

      const response = await fetch(`/api/map/layers?${params.toString()}`)
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
  }, [dateFilter.startDate?.toISOString(), dateFilter.endDate?.toISOString()]) // Re-fetch when dates change - using string primitives for stability 

  // Initialize visibility once
  useEffect(() => {
    if (!initializedRef.current && dynamicLayers.length > 0) {
        const initialSlugs: string[] = [];
        dynamicLayers.forEach(l => {
            if (l.groups && l.groups.length > 0) {
                // For grouped layers (like acoes), check all sub-items by default
                l.groups.forEach(g => initialSlugs.push(`${l.slug}__${g.id}`));
            }
            // Always add the parent slug too
            initialSlugs.push(l.slug);
        });
        
        setVisibleDynamicLayers(initialSlugs)
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

  const handleGroupToggle = (slugs: string[], isChecked: boolean) => {
    setVisibleDynamicLayers(prev => {
        if (isChecked) {
            // Add all slugs that are not already present
            const newSlugs = slugs.filter(s => !prev.includes(s));
            return [...prev, ...newSlugs];
        } else {
            // Remove all slugs
            return prev.filter(s => !slugs.includes(s));
        }
    })
  }

  const handleToggleAllDynamic = (isChecked: boolean) => {
      if (isChecked) {
          // Flatten all slugs
          const allSlugs: string[] = [];
          dynamicLayers.forEach(l => {
              if (l.groups && l.groups.length > 0) {
                  l.groups.forEach(g => allSlugs.push(`${l.slug}__${g.id}`));
                  // Also include parent slug if needed? Not really, but good for tracking
                  allSlugs.push(l.slug);
              } else {
                  allSlugs.push(l.slug);
              }
          });
          setVisibleDynamicLayers(allSlugs);
      } else {
          setVisibleDynamicLayers([]);
      }
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


  // TODO: A DETERMINAÇÃO DE ICONES DEVE VIR DO BACKEND
  const dynamicLayerOptions: LayerManagerOption[] = dynamicLayers.map(layer => {
    // Logic extraction helper
    const getVisuals = (lyr: LayerResponseDTO) => {
        let legendType: 'point' | 'line' | 'polygon' | 'circle' = 'polygon';
        let iconName = lyr.visualConfig?.mapMarker?.icon;
        
        // Support both nested mapMarker.type AND top-level type (flat JSON)
        const markerType = lyr.visualConfig?.mapMarker?.type || lyr.visualConfig?.type;

        if (markerType) {
            legendType = markerType;
        } else if (iconName) {
            legendType = 'point';
        } else {
             // Fallbacks
            if (lyr.slug === 'raw_firms') { iconName = 'flame'; legendType = 'point'; }
            else if (lyr.slug === 'deque-de-pedras' || lyr.slug === 'ponte-do-cure') { iconName = 'waves'; legendType = 'point'; }
            else if (lyr.slug === 'acoes') { iconName = 'activity'; legendType = 'point'; }
            else if (lyr.slug === 'estradas' || lyr.slug === 'leito') { legendType = 'line'; }
        }
        return { legendType, iconName };
    }

    const { legendType, iconName } = getVisuals(layer);
    const baseColor = layer.visualConfig?.mapMarker?.color || layer.visualConfig?.color || "#3388ff";
    const baseFill = layer.visualConfig?.mapMarker?.fillColor;
    
    // CASE A: GROUP BY COLUMN (Nest options)
    const groupByColumn = layer.visualConfig?.groupByColumn;

    if (groupByColumn) {
        // 1. Use Groups from Backend (or Fallback to Data if missing, though ideally backend provides it)
        const groups = layer.groups || [];
        
        // If no groups returned but we have data, maybe fallback? 
        // For now, let's rely on backend groups as requested.
        
        if (groups.length > 0) {
             // Generate Sub Options
            const subOptions: LayerManagerOption[] = groups.map(group => {
                const value = group.id;
                
                // Simple heuristic for default icons based on value name
                let subIcon = iconName;
                const v = String(group.label).toLowerCase();
                
                if (v.includes('fiscaliz')) subIcon = 'shield';
                else if (v.includes('recupera')) subIcon = 'sprout';
                else if (v.includes('monitora')) subIcon = 'eye';
                else if (v.includes('infra')) subIcon = 'hammer';
                else if (v.includes('incend') || v.includes('fogo')) subIcon = 'flame';
                else if (v.includes('agua') || v.includes('rio')) subIcon = 'waves';
                
                return {
                    id: `${layer.slug}__${value}`, // Composite ID
                    label: group.label, // Use label from backend
                    slug: `${layer.slug}__${value}`,
                    color: group.color || baseColor, // Use group color if available
                    icon: subIcon,
                    legendType: legendType,
                    fillColor: baseFill,
                    category: layer.visualConfig?.category 
                }
            });

            // Return Parent Option with SubOptions
            return {
                id: String(layer.id),
                label: layer.name,
                slug: layer.slug, // Parent slug (acting as container/folder)
                color: baseColor,
                icon: iconName,
                legendType: legendType,
                fillColor: baseFill,
                category: layer.visualConfig?.category,
                subOptions: subOptions
            };
        }
    }

    // CASE B: STANDARD SINGLE LAYER
    return {
        id: String(layer.id),
        label: layer.name,
        slug: layer.slug,
        color: baseColor,
        icon: iconName,
        legendType: legendType,
        fillColor: baseFill,
        category: layer.visualConfig?.category
    }
  })

  if (!isMounted) {
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

        {dynamicLayers.map(layer => {
            const groupByColumn = layer.visualConfig?.groupByColumn;
            let isVisible = false;
            let activeValues: string[] = [];

            if (groupByColumn) {
                // Check if any sub-items are active (slug__value)
                activeValues = visibleDynamicLayers
                    .filter(slug => slug.startsWith(`${layer.slug}__`))
                    .map(slug => slug.replace(`${layer.slug}__`, ''));
                
                if (activeValues.length > 0) isVisible = true;
            } else {
                isVisible = visibleDynamicLayers.includes(layer.slug);
            }

            if (!isVisible) return null;
          
          // Data Filtering Logic
          let displayData = layer.data;

          // Apply Group Filter if active
          if (groupByColumn && activeValues.length > 0) {
             displayData = {
                 ...displayData,
                 features: displayData.features.filter(f => activeValues.includes(f.properties?.[groupByColumn] as string))
             }
          }
          
          if (layer.visualConfig?.dateFilter && (dateFilter.startDate || dateFilter.endDate)) {
            // Find the date field - default to 'created_at' or specific fields known schema
             displayData = {
               ...displayData,
               features: displayData.features.filter(f => {
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


          // TODO: ESSA LÓGICA DEVERIA ESTAR NO BACKEND
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
            title="Camadas"
            options={dynamicLayerOptions}
            activeLayers={visibleDynamicLayers}
            onLayerToggle={handleDynamicLayerToggle}
            onToggleAll={handleToggleAllDynamic}
            onGroupToggle={handleGroupToggle}
        />
      </div>

      {loadingLayers && (
        <div className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-none">
            <div className="bg-brand-dark border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                <span className="text-slate-200 text-sm font-medium">Atualizando dados...</span>
            </div>
        </div>
      )}


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