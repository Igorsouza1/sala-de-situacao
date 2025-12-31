"use client"

import { useState, useCallback, useEffect } from "react"
import { useMap, useMapEvents, Polyline, CircleMarker, Marker, Tooltip } from "react-leaflet"
import { Ruler, X, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import L, { LatLng } from "leaflet"

export function MeasureControl() {
  const map = useMap()
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [points, setPoints] = useState<LatLng[]>([])
  const [cursorPos, setCursorPos] = useState<LatLng | null>(null)
  
  // Custom DivIcon for the cursor or markers if needed, but standard CircleMarkers work well for vertices.
  
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!isMeasuring) return
    
    setPoints(prev => [...prev, e.latlng])
  }, [isMeasuring])

  const handleMouseMove = useCallback((e: L.LeafletMouseEvent) => {
    if (!isMeasuring) {
        setCursorPos(null)
        return
    }
    setCursorPos(e.latlng)
  }, [isMeasuring])

  // Bind map events
  useMapEvents({
    click: handleMapClick,
    mousemove: handleMouseMove,
    // Right click to stop measuring could be nice
    contextmenu: () => {
        if (isMeasuring && points.length > 0) {
            setIsMeasuring(false)
        }
    }
  })

  // Close tool on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMeasuring) {
            setIsMeasuring(false)
            setCursorPos(null)
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMeasuring])

  // Change cursor style
  useEffect(() => {
    if (isMeasuring) {
      L.DomUtil.addClass(map.getContainer(), 'cursor-crosshair')
    } else {
      L.DomUtil.removeClass(map.getContainer(), 'cursor-crosshair')
    }
  }, [isMeasuring, map])


  // Calculate total distance
  const totalDistance = points.reduce((acc, point, index) => {
    if (index === 0) return 0
    return acc + points[index - 1].distanceTo(point)
  }, 0)

  // Calculate segment distance (from last point to cursor)
  const currentSegmentDistance = (points.length > 0 && cursorPos) 
    ? points[points.length - 1].distanceTo(cursorPos) 
    : 0

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${Math.round(meters)} m`
  }

  const clearMeasurement = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPoints([])
    setCursorPos(null)
  }

  const toggleMeasure = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMeasuring) {
        setIsMeasuring(false)
        setCursorPos(null)
    } else {
        setIsMeasuring(true)
        // If we want to start fresh every time we click the tool? 
        // Maybe keep existing points if user just toggled off temporarily.
        // Let's keep them.
    }
  }

  return (
    <>
        {/* Controls UI */}
        <div className="absolute top-60 right-4 z-[400] flex flex-col gap-2">
            <div className="flex items-center gap-1">
                 <Button
                    variant={isMeasuring ? "default" : "outline"}
                    size="icon"
                    className={`shadow-md ${isMeasuring ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-black hover:bg-gray-100'}`}
                    onClick={toggleMeasure}
                    title="Medir Distância"
                >
                    <Ruler className="h-4 w-4" />
                </Button>
                
                {/* Clear Button - only show if we have data */}
                {points.length > 0 && (
                    <Button
                        variant="destructive"
                        size="icon"
                        className="shadow-md"
                        onClick={clearMeasurement}
                        title="Limpar Medição"
                    >
                        <Eraser className="h-4 w-4" />
                    </Button>
                )}
            </div>
           
           {/* Total Result Panel - only show if we have significant measurement */}
           {points.length > 1 && (
               <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow-md border border-gray-200 text-sm font-medium text-slate-700 min-w-[100px] text-center animate-in fade-in slide-in-from-right-4">
                   Total: {formatDistance(totalDistance)}
               </div>
           )}
        </div>

        {/* Map Elements */}
        
        {/* 1. Committed Path (Solid Line) */}
        {points.length > 1 && (
            <Polyline 
                positions={points} 
                pathOptions={{ color: '#ec4899', weight: 4, opacity: 0.8 }} 
            />
        )}

        {/* 2. Ghost Line (Dashed, from last point to cursor) */}
        {isMeasuring && points.length > 0 && cursorPos && (
            <Polyline
                positions={[points[points.length - 1], cursorPos]}
                pathOptions={{ color: '#ec4899', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
                interactive={false}
            />
        )}

        {/* 3. Vertices (Points) */}
        {points.map((point, idx) => (
            <CircleMarker 
                key={`${idx}-${point.lat}-${point.lng}`}
                center={point}
                radius={4}
                pathOptions={{ color: '#fff', fillColor: '#ec4899', fillOpacity: 1, weight: 2 }}
                interactive={false}
            >
                {/* Show distance at each vertex (accumulated) */}
                {idx > 0 && (
                    <Tooltip direction="top" opacity={0.9}>
                        {formatDistance(points.slice(0, idx + 1).reduce((acc, p, i) => i===0 ? 0 : acc + points[i-1].distanceTo(p), 0))}
                    </Tooltip>
                )}
            </CircleMarker>
        ))}
        
        {/* 4. Cursor Marker & Dynamic Tooltip */}
        {isMeasuring && cursorPos && (
            <CircleMarker
                center={cursorPos}
                radius={3}
                pathOptions={{ color: '#ec4899', fillColor: 'transparent', weight: 1 }}
                interactive={false}
            >
                 {points.length > 0 && (
                     <Tooltip 
                        direction="right" 
                        permanent 
                        offset={[10, 0]} 
                        className="bg-transparent border-0 shadow-none text-pink-600 font-bold"
                     >
                        {formatDistance(currentSegmentDistance)}
                     </Tooltip>
                 )}
            </CircleMarker>
        )}

    </>
  )
}
