"use client"

import { useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { AlertTriangle, Tag, Info } from "lucide-react"

// --- ICONS ---
// Need to create custom divIcons for the actions similar to main map but simpler
const createIcon = (color: string, iconName: string) => {
    // Determine icon (using lucide names to map to something visual in HTML string if needed, 
    // or just using simple colored markers for now to ensure robustness)
    
    // Using standard Leaflet DivIcon with Tailwind classes
    return L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${color}">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><circle cx="12" cy="12" r="10"/></svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    })
}

// Improved Icon Factory
const getActionIcon = (category: string, status: string) => {
    const cat = (category || "").toLowerCase();
    const stat = (status || "").toLowerCase();

    let color = "bg-blue-500";
    if (cat.includes('fiscaliza') || cat.includes('incidente') || stat.includes('critico')) {
        color = "bg-red-500";
    } else if (cat.includes('recupera')) {
        color = "bg-green-500";
    }

    return L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center ${color}">
                 <div class="w-2 h-2 bg-white rounded-full"></div>
               </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })
}


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

             {/* Property Polygon */}
             <GeoJSON 
                data={geoJsonData} 
                style={{
                    color: '#f59e0b', // Amber/Yellow
                    weight: 3,
                    fillColor: '#f59e0b',
                    fillOpacity: 0.1,
                    dashArray: '5, 5'
                }}
             />

             {/* Action Markers */}
             {acoes && acoes.map(acao => {
                 if (!acao.latitude || !acao.longitude) return null;
                 return (
                     <Marker 
                        key={acao.id} 
                        position={[parseFloat(acao.latitude), parseFloat(acao.longitude)]}
                        icon={getActionIcon(acao.categoria, acao.status)}
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
