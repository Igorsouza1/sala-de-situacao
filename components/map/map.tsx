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

// Helper to resolve style for a specific feature based on rules
const resolveFeatureStyle = (finalVisualConfig: any, feature?: any) => {
    let style = {
        ...finalVisualConfig?.baseStyle // Start with base style
    };

    // Apply Rules: Iterate over array
    if (finalVisualConfig?.rules && Array.isArray(finalVisualConfig.rules) && feature?.properties) {
        finalVisualConfig.rules.forEach((rule: any) => {
             const { field, values, styleProperty } = rule;
             const featureValue = feature.properties[field];

             if (featureValue && values[featureValue]) {
                 const override = values[featureValue];
                 
                 // If styleProperty is defined, override only that property
                 if (styleProperty) {
                     // @ts-ignore
                     style[styleProperty] = override;
                 } else {
                     // Merge full style object
                     style = {
                         ...style,
                         ...override as any
                     };
                 }
             }
        });
    }
    
    return style;
};


const getLayerStyle = (visualConfig: LayerResponseDTO['visualConfig'], feature?: any) => {
  if (!visualConfig) return {};

  // Compatibility: Handle both new nested structure and old flat structure
  // If baseStyle exists, we assume new structure. Otherwise fallback to root.
  const baseConfig = visualConfig.baseStyle ? visualConfig : { baseStyle: visualConfig }; // Wrap old config if needed for uniform access, or just handle manually below.
  
  // Actually, let's normalize first. 
  // If visualConfig has direct color/weight etc, treat it as baseStyle.
  const normalizedConfig = {
      baseStyle: visualConfig.baseStyle || visualConfig,
      rules: visualConfig.rules
  };

  const resolvedStyle = resolveFeatureStyle(normalizedConfig, feature);

  return {
    color: resolvedStyle.color || '#3388ff',
    fillColor: resolvedStyle.fillColor || resolvedStyle.color || '#3388ff', // Fallback to outline color if fill missing
    weight: resolvedStyle.weight ?? 2,
    opacity: resolvedStyle.opacity ?? 1,
    fillOpacity: resolvedStyle.fillOpacity ?? 0.2,
    // Add other leaflet path options if needed
    dashArray: resolvedStyle.dashArray
  };
};

// Helper to determine layer style for rendering
const getPointToLayer = (visualConfig: LayerResponseDTO['visualConfig'], slug: string) => {
  return (feature: any, latlng: L.LatLng) => {
    // 1. Normalize Config
    const normalizedConfig = {
        baseStyle: visualConfig?.baseStyle || visualConfig || {},
        rules: visualConfig?.rules
    };

    // 2. Resolve Style for this specific feature
    const resolvedStyle = resolveFeatureStyle(normalizedConfig, feature);
    
    // 3. Determine Marker Type
    // Priority: Rule Override -> Base Style -> Default 'circle'
    const markerType = resolvedStyle.type || 'circle';
    const color = resolvedStyle.color || '#3388ff';

    // 4. Render
    if (markerType === 'icon' && resolvedStyle.iconName) {
        return L.marker(latlng, { 
            icon: createCustomIcon(resolvedStyle.iconName, color) 
        });
    }

    if (markerType === 'circle') {
      return L.circleMarker(latlng, {
        color: color,
        fillColor: resolvedStyle.fillColor || color,
        fillOpacity: resolvedStyle.fillOpacity ?? 0.8,
        radius: resolvedStyle.radius || 6,
        weight: resolvedStyle.weight ?? 1,
        opacity: resolvedStyle.opacity ?? 1
      });
    }
    
    // Default marker (Leaflet Pin) if nothing else matches
    return L.marker(latlng);
  }
}




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
    // Simplified logic: visual config comes from DTO (backend)
    const getVisuals = (lyr: LayerResponseDTO) => {
        let legendType: 'point' | 'line' | 'polygon' | 'circle' | 'icon' | 'heatmap' = 'polygon';
        
        // 1. Resolve Config
        const config = lyr.visualConfig;
        const baseStyle = config?.baseStyle;
        
        // 2. Determine Type & Icon
        // Priority: baseStyle.type -> legacy mapMarker.type -> legacy type
        const type = baseStyle?.type || config?.mapMarker?.type || config?.type;
        const iconName = baseStyle?.iconName || config?.mapMarker?.icon || config?.iconName; // Support legacy icon lookup if needed

        if (type) {
            legendType = type;
        } else if (iconName) {
            legendType = 'icon'; // Infer icon type if iconName is present but type is missing
        } 
        
        return { legendType, iconName };
    }

    const { legendType, iconName } = getVisuals(layer);
    const config = layer.visualConfig;
    const baseStyle = config?.baseStyle;
    
    const baseColor = baseStyle?.color || config?.mapMarker?.color || config?.color || "#3388ff";
    const baseFill = baseStyle?.fillColor || config?.mapMarker?.fillColor;
    
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

        {processedLayers.map((layerItem) => (
          <GeoJSON
            key={layerItem.componentKey}
            data={layerItem.displayData}
            style={(feature) => getLayerStyle(layerItem.visualConfig, feature)}
            pointToLayer={layerItem.pointToLayer}
            onEachFeature={(feature, l) => {
              // Bind Popup based on Schema Config OR VisualConfig.popupFields
              const fields = layerItem.visualConfig?.popupFields || layerItem.schemaConfig?.fields;
              
              if (fields?.length) {
                const popupContent = `
                       <div class="p-2 min-w-[200px]">
                         <h3 class="font-bold mb-2 text-sm border-b pb-1">${layerItem.name}</h3>
                         <div class="space-y-1 text-xs">
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
                     `
                l.bindPopup(popupContent)
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