import L from "leaflet"
import { renderToStaticMarkup } from "react-dom/server"
import {  Flame, Waves, MapPin } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { LayerResponseDTO } from "@/types/map-dto"

// Helper to convert kebab-case or snake_case to PascalCase (e.g., "map-pin" -> "MapPin")
export const toPascalCase = (str: string) => {
  return str
    .replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    })
    .replace(/^./, (str) => str.toUpperCase());
};

export const createCustomIcon = (iconName: string, color: string) => {
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
        justifyContent: 'center',
        // Force background printing
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact'
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

// Helper to resolve style for a specific feature based on rules
export const resolveFeatureStyle = (finalVisualConfig: any, feature?: any) => {
    let style = {
        ...finalVisualConfig?.baseStyle // Start with base style
    };

    // Apply Rules: Iterate over array
    if (finalVisualConfig?.rules && Array.isArray(finalVisualConfig.rules) && feature?.properties) {
        finalVisualConfig.rules.forEach((rule: any) => {
             const { field, values, styleProperty } = rule;
             const rawValue = feature.properties[field];
             
             // Ensure valid key
             if (rawValue === undefined || rawValue === null) return;

             const featureValue = String(rawValue).trim(); // convert to string and trim

             // 1. Direct Match
             let match = values[featureValue];

             // 2. Case Insensitive Fallback
             if (match === undefined) {
                 const lowerValue = featureValue.toLowerCase();
                 // @ts-ignore
                 const foundKey = Object.keys(values).find(k => k.toLowerCase() === lowerValue);
                 if (foundKey) {
                    match = values[foundKey];
                 }
             }

             if (match !== undefined) {
                 const override = match;
                 
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


export const getLayerStyle = (visualConfig: LayerResponseDTO['visualConfig'], feature?: any) => {
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
export const getPointToLayer = (visualConfig: LayerResponseDTO['visualConfig'], slug: string) => {
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

// --- STANDARD CONFIGS (HARDCODED FALLBACKS) ---

export const PROPRIEDADE_STYLE_CONFIG: any = {
    baseStyle: {
        color: '#f59e0b', // Amber/Yellow
        weight: 3,
        fillColor: '#f59e0b',
        fillOpacity: 0.1,
        dashArray: '5, 5',
        type: 'polygon'
    }
}

export const BANHADO_STYLE_CONFIG: any = {
    baseStyle: {
        color: '#3b82f6', // Blue
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.5,
        type: 'polygon'
    }
}

export const ACOES_VISUAL_CONFIG: any = {
    baseStyle: {
        color: "#3b82f6", // blue-500
        iconName: "tag",
        type: "icon"
    },
    rules: [
        {
            field: "categoria",
            values: {
                "Fiscalização": { color: "#ef4444", iconName: "alert-triangle" },
                "Incidente": { color: "#ef4444", iconName: "alert-triangle" },
                "Recuperação": { color: "#22c55e", iconName: "sprout" },
                "Monitoramento": { color: "#3b82f6", iconName: "eye" }
            }
        },
        {
            field: "status",
            values: {
                "Crítico": { color: "#ef4444", iconName: "alert-octagon" },
                "Critico": { color: "#ef4444", iconName: "alert-octagon" },
                "Alert": { color: "#f59e0b", iconName: "alert-circle" }
            }
        }
    ]
};

// --- LEGEND & UI HELPERS ---

export const getLayerLegendInfo = (visualConfig: any) => {
    let legendType: 'point' | 'line' | 'polygon' | 'circle' | 'icon' | 'heatmap' = 'polygon';
    
    // 1. Resolve Config (Handle legacy flat vs new structure)
    const baseStyle = visualConfig?.baseStyle || visualConfig;
    
    // 2. Determine Type & Icon
    // Priority: baseStyle.type -> legacy mapMarker.type -> legacy type
    const type = baseStyle?.type || visualConfig?.mapMarker?.type || visualConfig?.type;
    const iconName = baseStyle?.iconName || visualConfig?.mapMarker?.icon || visualConfig?.iconName; 

    if (type) {
        legendType = type;
    } else if (iconName) {
        legendType = 'icon'; 
    } 

    // 3. Determine Colors
    const color = baseStyle?.color || visualConfig?.mapMarker?.color || visualConfig?.color || "#3388ff";
    const fillColor = baseStyle?.fillColor || visualConfig?.mapMarker?.fillColor; // Can be undefined

    return { 
        legendType, 
        iconName, 
        color, 
        fillColor 
    };
}
