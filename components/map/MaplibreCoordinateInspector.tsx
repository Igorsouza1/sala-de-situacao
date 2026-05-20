"use client"

import { useEffect, useState } from "react"
import { Crosshair, Copy, Check, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Coordinate {
  lat: number
  lng: number
}

interface MaplibreCoordinateInspectorProps {
  isActive: boolean
  onToggle: () => void
  coordinate: Coordinate | null
}

export function MaplibreCoordinateInspector({
  isActive,
  onToggle,
  coordinate,
}: MaplibreCoordinateInspectorProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) onToggle()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, onToggle])

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!coordinate) return
    navigator.clipboard
      .writeText(`${coordinate.lat.toFixed(6)}, ${coordinate.lng.toFixed(6)}`)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
  }

  return (
    <div className="absolute top-80 right-4 z-[400] flex flex-col gap-2 items-end">
      <Button
        variant={isActive ? "default" : "outline"}
        size="icon"
        className={`shadow-md transition-all ${
          isActive
            ? "bg-brand-primary text-white border-brand-primary"
            : "bg-white text-black hover:bg-gray-100"
        }`}
        onClick={onToggle}
        title="Capturar Coordenadas"
      >
        <Crosshair className="h-4 w-4" />
      </Button>

      {isActive && coordinate && (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200 flex flex-col gap-2 min-w-[200px]">
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
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
        </div>
      )}
    </div>
  )
}
