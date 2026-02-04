"use client"

import {  Flame, Waves, MapPin } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import type { LatLngExpression } from "leaflet"
import { CustomZoomControl } from "./CustomZoomControl"
import { CustomLayerControl } from "./CustomLayerControl"
import { MapPlaceholder } from "./MapPlaceholder"
import { DateFilterControl } from "./DateFilterControl"
import { MeasureControl } from "./MeasureControl"
import { CoordinateInspector } from "./CoordinateInspector"
import { SnapshotControl } from "./SnapshotControl"
import { useMapContext } from "@/context/GeoDataContext"
import L from "leaflet"
import { FeatureDetails } from "./feature-details"
import { Modal } from "./Modal"
import { EditAcaoModal } from "./EditAcaoModal"
import { useUserRole } from "@/hooks/useUserRole"
import { LayerManager, LayerManagerOption } from "./LayerManager"
import { Button } from "@/components/ui/button"
import { LayerResponseDTO } from "@/types/map-dto"


// Imports Dinâmicos
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), { ssr: false })

interface MapProps {
  center?: LatLngExpression
  zoom?: number 
}

import { getLayerStyle, getPointToLayer, getLayerLegendInfo } from "./helpers/map-visuals"

// Helper to convert kebab-case or snake_case to PascalCase (Removed as it is now in helper)

// --- ESTILOS ESTÁTICOS --- (Moved to Helpers)

// --- HELPER DE ESTILIZAÇÃO DINÂMICA --- (Moved to Helpers)




export default function Map({ center = [-21.327773, -56.694734], zoom = 11 }: MapProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  const [dynamicLayers, setDynamicLayers] = useState<LayerResponseDTO[]>([])
  const [visibleDynamicLayers, setVisibleDynamicLayers] = useState<string[]>([])
  const [loadingLayers, setLoadingLayers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataVersion, setDataVersion] = useState(0)
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
      params.append('_t', String(Date.now())); // Prevent caching

      const response = await fetch(`/api/map/layers?${params.toString()}`)
      if (response.ok) {
        const data: LayerResponseDTO[] = await response.json()
        setDynamicLayers(data.sort((a,b) => (a.ordering || 0) - (b.ordering || 0)))
        setDataVersion(prev => prev + 1) // Force re-render of GeoJSON layers
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

  // --- MEMOIZED DATA PROCESSING ---
  // Memoize the filtering and style preparation to avoid heavy loops on every render (e.g. modal open)
  const processedLayers = useMemo(() => {
    return dynamicLayers
      .map((layer) => {
        // Check rules array for field used as fallback
        const ruleField = layer.visualConfig?.rules?.[0]?.field;
        const groupByColumn = layer.visualConfig?.groupByColumn || ruleField
        let isVisible = false
        let activeValues: string[] = []

        // 1. Determine Visibility
        if (groupByColumn) {
          // Check if any sub-items are active (slug__value)
          activeValues = visibleDynamicLayers
            .filter((slug) => slug.startsWith(`${layer.slug}__`))
            .map((slug) => slug.replace(`${layer.slug}__`, ""))

          if (activeValues.length > 0) isVisible = true
        } else {
          isVisible = visibleDynamicLayers.includes(layer.slug)
        }

        if (!isVisible) return null

        // 2. Data Filtering Logic
        let displayData = layer.data

        // Apply Group Filter if active
        if (groupByColumn && activeValues.length > 0) {
          displayData = {
            ...displayData,
            features: displayData.features.filter((f) =>
              activeValues.includes(f.properties?.[groupByColumn] as string)
            ),
          }
        }

        // 3. Pre-calculate standard Props
        // This avoids calling getLayerStyle and getPointToLayer repeatedly if not needed,
        // although they are cheap, organizing them here is cleaner.
        const style = getLayerStyle(layer.visualConfig)
        const pointToLayer = getPointToLayer(layer.visualConfig, layer.slug)

        return {
          slug: layer.slug,
          name: layer.name,
          displayData,
          // style, // REMOVED: Style is now per-feature in <GeoJSON>
          pointToLayer,
          visualConfig: layer.visualConfig,
          schemaConfig: layer.schemaConfig,
          // Create a unique key for the GeoJSON component to force re-mounting only when data changes significantly
          // leveraging feature count is a simple heuristic.
          componentKey: `${layer.slug}-${displayData.features.length}-${dataVersion}`,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }, [dynamicLayers, visibleDynamicLayers, dataVersion])

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
    // 1. Resolve Visuals from Helper
    const { legendType, iconName, color: baseColor, fillColor: baseFill } = getLayerLegendInfo(layer.visualConfig);
    const config = layer.visualConfig;
    
    // CASE A: GROUP BY COLUMN (Nest options or Rules)
    const firstRule = config?.rules?.[0]; // Strategy: use first rule for grouping if available
    const groupByColumn = config?.groupByColumn || firstRule?.field;

    if (groupByColumn) {
        // 1. Use Groups from Backend (or Fallback to Data if missing, though ideally backend provides it)
        let groups = layer.groups || [];

        // 2. Fallback: If no groups but we have RULES, derive groups from RULES
        if (groups.length === 0 && firstRule?.values) {
             groups = Object.entries(firstRule.values).map(([key, value]) => {
                 // Value can be string or object now
                 const style = typeof value === 'string' ? {} : value as any;
                 
                 return {
                    id: key,
                    label: key, // Or some formatted label
                    color: style.color || baseColor,
                    icon: style.iconName || (firstRule.styleProperty === 'iconName' ? value : iconName)
                 }
             });
        }
        
        // If no groups returned but we have data, maybe fallback? 
        // For now, let's rely on backend groups as requested.
        
        if (groups.length > 0) {
             // Generate Sub Options
            const subOptions: LayerManagerOption[] = groups.map(group => {
                const value = group.id;
                // Use icon from backend group, fallback to layer icon
                const subIcon = group.icon || iconName;
                
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
        id="main-map"
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
        <MeasureControl />
        <CoordinateInspector />
        <SnapshotControl activeLayers={visibleDynamicLayers} />

        {processedLayers.map((layerItem) => (
          <GeoJSON
            key={layerItem.componentKey}
            data={layerItem.displayData}
            style={(feature) => getLayerStyle(layerItem.visualConfig, feature)}
            pointToLayer={layerItem.pointToLayer}
            onEachFeature={(feature, l) => {
              // Bind Popup based on Schema Config OR VisualConfig.popupFields
              const fields = layerItem.visualConfig?.popupFields || layerItem.schemaConfig?.fields;
              
              const generateContent = (isTooltip = false) => {
                 if (!fields?.length) return null;
                 
                  // For tooltips, maybe show less info or cleaner? 
                  // For now, let's show the same content but in a tooltip structure
                  return `
                       <div class="${isTooltip ? 'p-1 min-w-[150px]' : 'p-2 min-w-[200px]'}">
                         <h3 class="font-bold ${isTooltip ? 'mb-1 text-xs' : 'mb-2 text-sm'} border-b pb-1">
                            ${layerItem.name} 
                            ${isTooltip ? '' : ''}
                         </h3>
                         <div class="space-y-1 ${isTooltip ? 'text-[10px]' : 'text-xs'}">
                           ${fields
                             .map(
                               (field) => `
                             <div class="flex justify-between gap-4">
                               <span class="text-slate-500">${field.label}:</span>
                               <span class="font-medium text-slate-800">${
                                 feature.properties[field.key] ?? "-"
                               }</span>
                             </div>
                           `
                             )
                             .join("")}
                         </div>
                       </div>
                     `;
              }

              const popupContent = generateContent(false);

              if (popupContent) {
                l.bindPopup(popupContent)
              }

              // HOVER TOOLTIP LOGIC
              const EXCLUDED_HOVER_LAYERS = ['propriedades', 'propriedade', 'banhado'];
              // Check exact slug or if slug starts with excluded prefix (if using namespacing)
              // Also check if the layer slug *contains* the word if strict match isn't enough, 
              // but user said "propriedade" and "banhado".
              const isExcluded = EXCLUDED_HOVER_LAYERS.some(ex => layerItem.slug.includes(ex));

              if (!isExcluded && popupContent) {
                  // Use same content or simplified? using same for now as requested "informações sobre eles"
                  const tooltipContent = generateContent(true);
                  if (tooltipContent) {
                       l.bindTooltip(tooltipContent, {
                           sticky: true, // Follow mouse
                           direction: 'top',
                           opacity: 0.95,
                           className: 'custom-map-tooltip' // We can style this in global css if needed
                       });

                       // Add hover effect to highlight
                       l.on({
                           mouseover: (e: any) => {
                               const layer = e.target;
                               if (layer.setStyle) {
                                   try {
                                       layer.setStyle({
                                           weight: (layerItem.visualConfig?.mapMarker?.weight || 2) + 2,
                                           fillOpacity: 0.5
                                       });
                                   } catch(err) {
                                        // Ignore if setStyle not supported (e.g. Marker)
                                   }
                               }
                           },
                           mouseout: (e: any) => {
                               // Reset style
                               const layer = e.target;
                               if (layerItem.slug !== 'acoes' && layer.setStyle) { // Don't mess with acoes selection style if we had one? 
                                    // Actually we re-apply base style. 
                                    // A better way is using GeoJSON's resetStyle but we don't have ref to it easily here inside onEachFeature without closure
                                    // Re-calculating style for this feature:
                                    const baseStyle = getLayerStyle(layerItem.visualConfig, feature);
                                    try {
                                        layer.setStyle(baseStyle);
                                    } catch(err) {
                                        // Ignore
                                    }
                               }
                           }
                       })
                  }
              }

              l.on({
                click: () =>
                  handleFeatureClick(feature.properties, layerItem.slug),
              })
            }}
          />
        ))}
      </MapContainer>

      <div className="absolute top-44 right-4 z-[400]">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            fetchLayers();
          }}
          className="bg-white hover:bg-gray-100 shadow-md text-black border-input"
          title="Atualizar dados"
        >
          <LucideIcons.RefreshCw 
            className={`h-4 w-4 ${loadingLayers ? 'animate-spin' : ''}`} 
          />
        </Button>
      </div>

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