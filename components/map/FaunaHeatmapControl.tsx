"use client"

import { useState, useEffect } from "react"
import { PawPrint } from "lucide-react"
import { FilterPopover } from "./FilterPopover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useMap, CircleMarker, Tooltip } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

// Heatmap Layer Component that attaches to the Map
function FaunaHeatmapLayer({
  data,
  isActive
}: {
  data: [number, number, number][]
  isActive: boolean
}) {
  const map = useMap()

  useEffect(() => {
    if (!isActive || data.length === 0) return

    // Ensure L.heatLayer is available
    if (typeof (L as any).heatLayer !== "function") {
      console.error("Leaflet.heat plugin is not loaded correctly.")
      return
    }

    // Create a custom pane so the heatmap draws ON TOP of GeoJSON layers
    if (!map.getPane("heatmapPane")) {
      const pane = map.createPane("heatmapPane")
      pane.style.zIndex = "450" // overlayPane is 400, shadowPane is 500
      pane.style.pointerEvents = "none" // allow clicks to pass through to underlying layers
    }

    // Create heat layer using L.heatLayer
    const heatLayer = (L as any).heatLayer(data, {
      radius: 40,
      blur: 25,
      maxZoom: 17,
      max: 0.5, // Increased sensitivity for small quantity of points
      pane: "heatmapPane",
      gradient: {
        0.4: "blue",
        0.6: "cyan",
        0.7: "lime",
        0.8: "yellow",
        1.0: "red"
      }
    })

    heatLayer.addTo(map)

    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer)
      }
    }
  }, [map, data, isActive])

  return null
}

function FaunaLocationsLayer({
  data,
  isActive
}: {
  data: [number, number, number][]
  isActive: boolean
}) {
  if (!isActive || data.length === 0) return null

  return (
    <>
      {data.map((point, index) => (
        <CircleMarker
          key={index}
          center={[point[0], point[1]]}
          radius={6}
          pathOptions={{ 
            color: "#ea580c", // orange-600
            fillColor: "#f97316", // orange-500
            fillOpacity: 0.7,
            weight: 2
          }}
        >
          <Tooltip>
            Registro de Fauna Exótica (Javali)<br/>
            Lat: {point[0].toFixed(4)} Lng: {point[1].toFixed(4)}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}

export function FaunaHeatmapControl() {
  const [isHeatmapActive, setIsHeatmapActive] = useState(false)
  const [isLocationsActive, setIsLocationsActive] = useState(false)
  
  const [data, setData] = useState<[number, number, number][]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const isAnyActive = isHeatmapActive || isLocationsActive

  useEffect(() => {
    // Only fetch when activated for the first time
    if (isAnyActive && !hasFetched && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const res = await fetch("/api/map/heatmap/fauna-exotica")
          const json = await res.json()
          if (json.success && json.data) {
            setData(json.data)
            setHasFetched(true)
          } else {
            console.error("Failed to load heatmap data:", json.error)
          }
        } catch (error) {
          console.error("Error fetching heatmap data:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchData()
    }
  }, [isAnyActive, hasFetched, isLoading])

  return (
    <>
      <FaunaHeatmapLayer data={data} isActive={isHeatmapActive} />
      <FaunaLocationsLayer data={data} isActive={isLocationsActive} />

      <FilterPopover icon={PawPrint} title="Fauna Exótica (Javalis)">
        {() => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap-switch" className="text-sm font-medium text-slate-700 cursor-pointer">
                Mapa de Calor
              </Label>
              <Switch
                id="heatmap-switch"
                checked={isHeatmapActive}
                onCheckedChange={setIsHeatmapActive}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="locations-switch" className="text-sm font-medium text-slate-700 cursor-pointer">
                Localizações Pontuais
              </Label>
              <Switch
                id="locations-switch"
                checked={isLocationsActive}
                onCheckedChange={setIsLocationsActive}
                disabled={isLoading}
              />
            </div>

            {isLoading && (
              <p className="text-xs text-slate-500 animate-pulse">Carregando dados...</p>
            )}
            {hasFetched && data.length > 0 && (
              <p className="text-xs text-slate-500">
                {data.length} registros encontrados.
              </p>
            )}
            {hasFetched && data.length === 0 && !isLoading && (
              <p className="text-xs text-amber-600">
                Nenhum registro encontrado com coordenadas.
              </p>
            )}
          </div>
        )}
      </FilterPopover>
    </>
  )
}
