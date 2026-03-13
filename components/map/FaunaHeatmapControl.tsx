"use client"

import { useState, useEffect } from "react"
import { PawPrint } from "lucide-react"
import { FilterPopover } from "./FilterPopover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useMap } from "react-leaflet"
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

    // Create heat layer using L.heatLayer
    // The cast to any is due to leaflet.heat typings sometimes having issues
    // or missing on standard L object directly.
    const heatLayer = (L as any).heatLayer(data, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
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

export function FaunaHeatmapControl() {
  const [isActive, setIsActive] = useState(false)
  const [data, setData] = useState<[number, number, number][]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    // Only fetch when activated for the first time
    if (isActive && !hasFetched && !isLoading) {
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
  }, [isActive, hasFetched, isLoading])

  return (
    <>
      {isActive && <FaunaHeatmapLayer data={data} isActive={isActive} />}

      <FilterPopover icon={PawPrint} title="Fauna Exótica">
        {() => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="heatmap-switch" className="text-sm font-medium text-slate-700 cursor-pointer">
                Mapa de Calor (Javalis)
              </Label>
              <Switch
                id="heatmap-switch"
                checked={isActive}
                onCheckedChange={setIsActive}
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
