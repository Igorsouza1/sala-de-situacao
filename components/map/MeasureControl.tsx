"use client"

import { useState, useCallback, useEffect } from "react"
import { useMap, useMapEvents, Polyline, CircleMarker, Tooltip, Polygon } from "react-leaflet"
import { Ruler, Eraser, SquareDashed } from "lucide-react"
import { Button } from "@/components/ui/button"
import L, { LatLng } from "leaflet"

// Helper to calculate polygon area (Spherical) using Shoelace formula approximation for small areas or library
// Since we don't want extra deps, let's use a simple spherical implementation or L.GeometryUtil if available (it's not in core)
// This is a rough implementation of spherical area
const EARTH_RADIUS = 6378137; // meters

const calculateArea = (latLngs: LatLng[]) => {
    if (latLngs.length < 3) return 0;
    
    // Convert to simplified array of {x, y} for projection or use spherical formula
    // Using simple spherical excess for accuracy on globe
    let area = 0.0;
    if (latLngs.length > 2) {
        for (let i = 0; i < latLngs.length; i++) {
            const p1 = latLngs[i];
            const p2 = latLngs[(i + 1) % latLngs.length];
            area += ((p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180)));
        }
        area = Math.abs(area * EARTH_RADIUS * EARTH_RADIUS / 2.0);
        // Correction for radians vs degrees if needed, but the formula above is specific. 
        // Let's use a more standard implementation: 
        // ref: https://github.com/Leaflet/Leaflet.draw/blob/develop/src/GeometryUtil.js#L3
        // Actually, simple planar projection is often enough for small areas, but let's try to be decent.
        
        // Simpler approach: Ring area (Planar approximation for visual feedback, acceptable for small/medium scale)
        // or just import a tiny helper if we were allowed.
        // Let's stick to this one which is effectively: Area = R^2 / 2 * sum( (lon2 - lon1) * (2 + sin(lat1) + sin(lat2)) ) converted to rads?
        // No, let's use the standard "Planar" area on projected coords if we could project.
        
        // Re-implementing a robust one from OpenLayers/Leaflet.GeometryUtil logic manually:
        const toRad = (deg: number) => deg * Math.PI / 180;
        let area2 = 0;
        for (let i = 0; i < latLngs.length; i++) {
            const p1 = latLngs[i];
            const p2 = latLngs[(i + 1) % latLngs.length];
            area2 += (toRad(p2.lng) - toRad(p1.lng)) * (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
        }
        area = Math.abs(area2 * EARTH_RADIUS * EARTH_RADIUS / 2.0);
    }
    
    return area;
}

type MeasureMode = 'distance' | 'area' | null;

export function MeasureControl() {
  const map = useMap()
  const [measureMode, setMeasureMode] = useState<MeasureMode>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<LatLng[]>([])
  const [cursorPos, setCursorPos] = useState<LatLng | null>(null)
  
  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!measureMode || !isDrawing) return
    setPoints(prev => [...prev, e.latlng])
  }, [measureMode, isDrawing])

  const handleMouseMove = useCallback((e: L.LeafletMouseEvent) => {
    if (!measureMode || !isDrawing) {
        setCursorPos(null)
        return
    }
    setCursorPos(e.latlng)
  }, [measureMode, isDrawing])

  const handleRightClick = useCallback(() => {
    if (measureMode && isDrawing && points.length > 0) {
        setIsDrawing(false)
        setCursorPos(null)
    }
  }, [measureMode, isDrawing, points])

  useMapEvents({
    click: handleMapClick,
    mousemove: handleMouseMove,
    contextmenu: handleRightClick
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (measureMode) {
            if (isDrawing) {
                // If drawing, just stop drawing but keep shape
                setIsDrawing(false)
                setCursorPos(null)
            } else {
                // If already stopped, clear everything
                setMeasureMode(null)
                setPoints([])
            }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [measureMode, isDrawing])

  useEffect(() => {
    if (measureMode && isDrawing) {
      L.DomUtil.addClass(map.getContainer(), 'cursor-crosshair')
      map.dragging.disable(); 
    } else {
      L.DomUtil.removeClass(map.getContainer(), 'cursor-crosshair')
      map.dragging.enable();
    }
  }, [measureMode, isDrawing, map])

  // Calculations
  const totalDistance = points.reduce((acc, point, index) => {
    if (index === 0) return 0
    return acc + points[index - 1].distanceTo(point)
  }, 0)

  const currentSegmentDistance = (points.length > 0 && cursorPos) 
    ? points[points.length - 1].distanceTo(cursorPos) 
    : 0

  const totalArea = calculateArea([...points, ...(cursorPos ? [cursorPos] : [])]);

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
    return `${Math.round(meters)} m`
  }

  const formatArea = (sqMeters: number) => {
    // Always use hectares
    const hectares = sqMeters / 10000;
    return `${hectares.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
  }

  const clearMeasurement = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    setPoints([])
    setCursorPos(null)
    setIsDrawing(true) // Reset to drawing mode if cleared?
  }

  const toggleMode = (mode: MeasureMode) => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (measureMode === mode) {
        setMeasureMode(null)
        setCursorPos(null)
        setIsDrawing(false)
    } else {
        setMeasureMode(mode)
        setPoints([])
        setCursorPos(null)
        setIsDrawing(true)
    }
  }

  return (
    <>
        {/* Controls UI */}
        <div className="absolute top-60 right-4 z-[400] flex flex-col gap-2">
             <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-md border border-gray-200">
                 {/* Distance Button */}
                 <Button
                    variant={measureMode === 'distance' ? "default" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 ${measureMode === 'distance' ? 'bg-brand-primary text-white hover:bg-brand-primary/90' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={toggleMode('distance')}
                    title="Medir Distância"
                >
                    <Ruler className="h-4 w-4" />
                </Button>

                 {/* Area Button */}
                 <Button
                    variant={measureMode === 'area' ? "default" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 ${measureMode === 'area' ? 'bg-brand-primary text-white hover:bg-brand-primary/90' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={toggleMode('area')}
                    title="Medir Área"
                >
                    <SquareDashed className="h-4 w-4" />
                </Button>
                
                {/* Clear Button */}
                {points.length > 0 && (
                    <>
                    <div className="w-[1px] h-4 bg-slate-300 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={clearMeasurement}
                        title="Limpar"
                    >
                        <Eraser className="h-4 w-4" />
                    </Button>
                    </>
                )}
            </div>
           
           {/* Result Panel */}
           {points.length > 0 && (
               <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow-md border border-gray-200 text-sm font-medium text-slate-700 min-w-[100px] text-center animate-in fade-in slide-in-from-right-4">
                   {measureMode === 'distance' ? (
                       <span>Distância: {formatDistance(totalDistance + (cursorPos ? currentSegmentDistance : 0))}</span>
                   ) : (
                       <span>Área: {formatArea(totalArea)}</span>
                   )}
               </div>
           )}
        </div>

        {/* --- MAP ELEMENTS --- */}

        {/* 1. DISTANCE MODE VISUALS */}
        {measureMode === 'distance' && (
            <>
                 {points.length > 1 && (
                    <Polyline 
                        positions={points} 
                        pathOptions={{ color: '#ec4899', weight: 4, opacity: 0.8 }} 
                        interactive={false}
                    />
                )}
                {/* Ghost line only if drawing */}
                {isDrawing && cursorPos && points.length > 0 && (
                     <Polyline
                        positions={[points[points.length - 1], cursorPos]}
                        pathOptions={{ color: '#ec4899', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
                        interactive={false}
                    />
                )}
            </>
        )}

        {/* 2. AREA MODE VISUALS */}
        {measureMode === 'area' && points.length > 0 && (
            <Polygon
                positions={[...points, ...(cursorPos && isDrawing ? [cursorPos] : [])]}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2, dashArray: isDrawing ? '5, 5' : undefined }}
                interactive={false}
            />
        )}

        {/* 3. VERTICES (Common) */}
        {measureMode && points.map((point, idx) => (
            <CircleMarker 
                key={`v-${idx}`}
                center={point}
                radius={4}
                pathOptions={{ 
                    color: '#fff', 
                    fillColor: measureMode === 'area' ? '#3b82f6' : '#ec4899', 
                    fillOpacity: 1, 
                    weight: 2 
                }}
                interactive={false}
            />
        ))}

        {/* 4. CURSOR & TOOLTIP */}
        {measureMode && cursorPos && isDrawing && (
            <CircleMarker
                center={cursorPos}
                radius={4}
                pathOptions={{ 
                    color: measureMode === 'area' ? '#3b82f6' : '#ec4899', 
                    fillColor: 'transparent', 
                    weight: 2 
                }}
                interactive={false}
            >
                 <Tooltip 
                    direction="right" 
                    permanent 
                    offset={[10, 0]} 
                    className={`bg-transparent border-0 shadow-none font-bold text-base ${measureMode === 'area' ? 'text-blue-600' : 'text-pink-600'}`}
                 >
                    {measureMode === 'distance' 
                        ? formatDistance(currentSegmentDistance)
                        : formatArea(totalArea)
                    }
                 </Tooltip>
            </CircleMarker>
        )}
    </>
  )
}
