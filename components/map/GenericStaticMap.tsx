"use client"

import { MapContainer, TileLayer, GeoJSON, Marker } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Default Icon Fix for Leaflet in Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

import { getLayerStyle, getPointToLayer } from "./helpers/map-visuals"

interface GenericStaticMapProps {
  center: [number, number]
  zoom: number
  layers: any[]
}

export default function GenericStaticMap({ center, zoom, layers }: GenericStaticMapProps) {
  // Styles and pointToLayer logic are now imported from helpers


  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
         center={center} 
         zoom={zoom} 
         scrollWheelZoom={false} 
         dragging={false}
         zoomControl={false}
         attributionControl={false}
         className="h-full w-full"
      >
         <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={['mt0','mt1','mt2','mt3']} />
         
         {layers.map((layerItem) => (
             layerItem.data && (
                <GeoJSON 
                    key={layerItem.id || layerItem.slug || Math.random()}
                    data={layerItem.data}
                    style={(feature) => getLayerStyle(layerItem.visualConfig, feature)}
                    pointToLayer={getPointToLayer(layerItem.visualConfig, layerItem.slug)}
                />
             )
         ))}
      </MapContainer>
    </div>
  )
}
