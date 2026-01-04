"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, GeoJSON } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

import { getLayerStyle, PROPRIEDADE_STYLE_CONFIG, BANHADO_STYLE_CONFIG } from "./helpers/map-visuals"

// Fix Leaflet Default Icon
// This runs only on client because this component is dynamically imported with ssr: false
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface DossieMapProps {
  lat: number
  lng: number
  propriedadeGeoJson?: any
  banhadoGeoJson?: any
}

export default function DossieMap({ lat, lng, propriedadeGeoJson, banhadoGeoJson }: DossieMapProps) {
  return (
    <div className="h-64 w-full relative z-0">
      <MapContainer 
         center={[lat, lng]} 
         zoom={15} 
         scrollWheelZoom={false} 
         dragging={false}
         zoomControl={false}
         attributionControl={false}
         className="h-full w-full"
      >
         <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={['mt0','mt1','mt2','mt3']} />
         <Marker position={[lat, lng]} icon={DefaultIcon} />
         
         {propriedadeGeoJson && (
             <GeoJSON 
                 data={typeof propriedadeGeoJson === 'string' ? JSON.parse(propriedadeGeoJson) : propriedadeGeoJson} 
                 style={(feature) => getLayerStyle(PROPRIEDADE_STYLE_CONFIG, feature)} 
             />
         )}
         {banhadoGeoJson && (
             <GeoJSON 
                 data={typeof banhadoGeoJson === 'string' ? JSON.parse(banhadoGeoJson) : banhadoGeoJson} 
                 style={(feature) => getLayerStyle(BANHADO_STYLE_CONFIG, feature)} 
             />
         )}
      </MapContainer>
      
      {/* Overlay de Coordenadas */}
      <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700 z-[1000] flex justify-between rounded shadow-sm">
         <span><strong>LAT:</strong> {lat.toFixed(6)}</span>
         <span><strong>LNG:</strong> {lng.toFixed(6)}</span>
         <span className="hidden sm:inline text-slate-400">DATUM: SIRGAS 2000</span>
      </div>

      {/* Legenda */}
      <div className="absolute top-2 right-2 bg-white/90 p-2 rounded text-[10px] space-y-1 z-[1000] shadow-sm border border-slate-200">
         <div className="flex items-center gap-2">
             <span className="w-3 h-3 bg-amber-500/20 border border-amber-500 border-dashed block rounded-sm"></span>
             <span className="font-semibold text-slate-700">Propriedade</span>
         </div>
         {banhadoGeoJson && (
             <div className="flex items-center gap-2">
                 <span className="w-3 h-3 bg-blue-500/20 border border-blue-500 block rounded-sm"></span>
                 <span className="font-semibold text-slate-700">Banhado</span>
             </div>
         )}
      </div>
    </div>
  )
}
