"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { AlertTriangle, Tag, Info } from "lucide-react"

import { createCustomIcon, resolveFeatureStyle, getLayerStyle, PROPRIEDADE_STYLE_CONFIG, ACOES_VISUAL_CONFIG } from "./helpers/map-visuals"

// Visual Config Definitiva para Ações vem do HELPER agora!

function MapController({ geojson, actions }: { geojson: any, actions: any[] }) {
    const map = useMap();
    const isReady = useRef(false);

    useEffect(() => {
        if (!geojson || isReady.current) return;
        
        try {
            const layer = L.geoJSON(geojson);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
                isReady.current = true;
            }
        } catch (e) {
            console.error("Error fitting bounds", e);
        }
    }, [geojson, map]);

    return null;
}

interface PropriedadeMapProps {
    propriedadeGeoJson: any;
    acoes: any[];
}

export default function PropriedadeMap({ propriedadeGeoJson, acoes }: PropriedadeMapProps) {
    const geoJsonData = useMemo(() => {
        if (!propriedadeGeoJson) return null;
        if (typeof propriedadeGeoJson === 'string') {
            try {
                return JSON.parse(propriedadeGeoJson);
            } catch (e) {
                console.error("Failed to parse GeoJSON", e);
                return null;
            }
        }
        return propriedadeGeoJson;
    }, [propriedadeGeoJson]);

    if (!geoJsonData) return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Sem geometria válida</div>;

    return (
        <MapContainer 
            style={{ height: '100%', width: '100%', background: '#f8fafc' }} 
            zoom={13} 
            center={[-21.4, -56.5]} 
            zoomControl={false}
            scrollWheelZoom={false}
            dragging={false}
            doubleClickZoom={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            attributionControl={false}
        >
             <TileLayer
                url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                maxZoom={20}
                subdomains={["mt0", "mt1", "mt2", "mt3"]}
             />

             {/* Property Polygon - USANDO HELPER */}
             <GeoJSON 
                data={geoJsonData} 
                style={(feature) => getLayerStyle(PROPRIEDADE_STYLE_CONFIG, feature)}
             />

             {/* Action Markers - Rendered Oldest to Newest (Newest on Top) */}
             {acoes && [...acoes]
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(acao => {
                 if (!acao.latitude || !acao.longitude) return null;
                 
                 // Resolve styling from Config based on acao properties
                 const style = resolveFeatureStyle(ACOES_VISUAL_CONFIG, { properties: acao });
                 const icon = createCustomIcon(style.iconName || "tag", style.color || "#3388ff");

                 return (
                     <Marker 
                        key={acao.id} 
                        position={[parseFloat(acao.latitude), parseFloat(acao.longitude)]}
                        icon={icon}
                        zIndexOffset={new Date(acao.date).getTime() / 1000} // Extra guarantee: z-index based on timestamp
                     >
                         <Popup className="custom-popup">
                             <div className="p-1">
                                 <strong className="block text-sm uppercase mb-1">{acao.name || "Ação"}</strong>
                                 <span className="text-xs text-slate-500">{new Date(acao.date).toLocaleDateString()}</span>
                             </div>
                         </Popup>
                     </Marker>
                 )
             })}

             <MapController geojson={geoJsonData} actions={acoes} />
        </MapContainer>
    )
}
