"use client"

import { useEffect } from "react"
import { Ruler, Eraser, SquareDashed } from "lucide-react"
import { Button } from "@/components/ui/button"

type MeasureMode = "distance" | "area" | null

interface MaplibreMeasureControlProps {
  mode: MeasureMode
  isDrawing: boolean
  hasPoints: boolean
  distance: number
  area: number
  onToggleMode: (mode: "distance" | "area") => void
  onClear: () => void
}

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${Math.round(meters)} m`
}

const formatArea = (sqMeters: number) => {
  const hectares = sqMeters / 10000
  return `${hectares.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ha`
}

export function MaplibreMeasureControl({
  mode,
  isDrawing,
  hasPoints,
  distance,
  area,
  onToggleMode,
  onClear,
}: MaplibreMeasureControlProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mode) {
        if (isDrawing) {
          // Stop drawing but keep shape — parent handles via onClear after Escape
          // The parent listens to this same event and stops drawing
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mode, isDrawing])

  return (
    <div className="absolute top-60 right-4 z-[400] flex flex-col gap-2">
      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-md shadow-md border border-gray-200">
        <Button
          variant={mode === "distance" ? "default" : "ghost"}
          size="icon"
          className={`h-8 w-8 ${
            mode === "distance"
              ? "bg-brand-primary text-white hover:bg-brand-primary/90"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => onToggleMode("distance")}
          title="Medir Distância"
        >
          <Ruler className="h-4 w-4" />
        </Button>

        <Button
          variant={mode === "area" ? "default" : "ghost"}
          size="icon"
          className={`h-8 w-8 ${
            mode === "area"
              ? "bg-brand-primary text-white hover:bg-brand-primary/90"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => onToggleMode("area")}
          title="Medir Área"
        >
          <SquareDashed className="h-4 w-4" />
        </Button>

        {hasPoints && (
          <>
            <div className="w-[1px] h-4 bg-slate-300 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={onClear}
              title="Limpar"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {hasPoints && (
        <div className="bg-white/90 backdrop-blur-sm p-2 rounded shadow-md border border-gray-200 text-sm font-medium text-slate-700 min-w-[100px] text-center">
          {mode === "distance" ? (
            <span>Distância: {formatDistance(distance)}</span>
          ) : (
            <span>Área: {formatArea(area)}</span>
          )}
        </div>
      )}
    </div>
  )
}
