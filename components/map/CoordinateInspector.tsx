"use client"

import { useState, useCallback, useEffect } from "react"
import { useMap, useMapEvents, CircleMarker, Popup } from "react-leaflet"
import { Crosshair, Copy, Check, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import L, { LatLng } from "leaflet"

export function CoordinateInspector() {
  const map = useMap()
  const [isActive, setIsActive] = useState(false)
  const [coordinate, setCoordinate] = useState<LatLng | null>(null)
  const [copied, setCopied] = useState(false)

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!isActive) return
    setCoordinate(e.latlng)
    setCopied(false) // Reset copy status on new click
  }, [isActive])

  useMapEvents({
    click: handleMapClick,
  })

  // Toggle cursor style
  useEffect(() => {
    if (isActive) {
      L.DomUtil.addClass(map.getContainer(), 'cursor-crosshair')
    } else {
      L.DomUtil.removeClass(map.getContainer(), 'cursor-crosshair')
    }
  }, [isActive, map])

  // Handle keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isActive) {
             setIsActive(false)
             setCoordinate(null)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive])

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!coordinate) return

    const text = `${coordinate.lat.toFixed(6)}, ${coordinate.lng.toFixed(6)}`
    navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    })
  }

  const toggleActive = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isActive) {
          setIsActive(false)
          setCoordinate(null)
      } else {
          setIsActive(true)
          setCoordinate(null)
      }
  }

  return (
    <>
      <div className="absolute top-80 right-4 z-[400] flex flex-col gap-2 items-end">
          {/* Main Toggle Button */}
          <Button
            variant={isActive ? "default" : "outline"}
            size="icon"
            className={`shadow-md transition-all ${isActive ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-black hover:bg-gray-100'}`}
            onClick={toggleActive}
            title="Capturar Coordenadas"
          >
            <Crosshair className="h-4 w-4" />
          </Button>

          {/* Result Panel (Floating next to button or separate?) */}
          {isActive && coordinate && (
             <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200 mt-2 flex flex-col gap-2 min-w-[200px] animate-in slide-in-from-right-4 fade-in">
                 <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-1 mb-1">
                     <span>Coordenadas</span>
                     <MapPin className="h-3 w-3" />
                 </div>
                 
                 <div className="flex flex-col gap-1 text-sm font-mono text-slate-700">
                     <span className="flex justify-between">
                         <span className="text-slate-400">Lat:</span> 
                         {coordinate.lat.toFixed(5)}
                     </span>
                     <span className="flex justify-between">
                         <span className="text-slate-400">Lng:</span>
                         {coordinate.lng.toFixed(5)}
                     </span>
                 </div>

                 <Button 
                    variant="secondary" 
                    size="sm" 
                    className="h-7 text-xs mt-1 w-full gap-2"
                    onClick={copyToClipboard}
                 >
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copiado!" : "Copiar"}
                 </Button>
             </div>
          )}
      </div>

      {/* Map Marker */}
      {isActive && coordinate && (
          <CircleMarker 
            center={coordinate}
            radius={6}
            pathOptions={{ 
                color: '#fff', 
                fillColor: '#f59e0b', // Amber-500
                fillOpacity: 1, 
                weight: 2 
            }}
          >
              <Popup offset={[0, -6]} closeButton={false} className="font-mono text-xs">
                 {coordinate.lat.toFixed(5)}, {coordinate.lng.toFixed(5)}
              </Popup>
          </CircleMarker>
      )}
    </>
  )
}
