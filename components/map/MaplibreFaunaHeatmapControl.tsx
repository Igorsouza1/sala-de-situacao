"use client"

import { PawPrint } from "lucide-react"
import { FilterPopover } from "./FilterPopover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface MaplibreFaunaHeatmapControlProps {
  isHeatmapActive: boolean
  isLocationsActive: boolean
  isLoading: boolean
  hasFetched: boolean
  dataCount: number
  onToggleHeatmap: (v: boolean) => void
  onToggleLocations: (v: boolean) => void
}

export function MaplibreFaunaHeatmapControl({
  isHeatmapActive,
  isLocationsActive,
  isLoading,
  hasFetched,
  dataCount,
  onToggleHeatmap,
  onToggleLocations,
}: MaplibreFaunaHeatmapControlProps) {
  return (
    <FilterPopover icon={PawPrint} title="Fauna Exótica (Javalis)">
      {() => (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="ml-heatmap-switch"
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              Mapa de Calor
            </Label>
            <Switch
              id="ml-heatmap-switch"
              checked={isHeatmapActive}
              onCheckedChange={onToggleHeatmap}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="ml-locations-switch"
              className="text-sm font-medium text-slate-700 cursor-pointer"
            >
              Localizações Pontuais
            </Label>
            <Switch
              id="ml-locations-switch"
              checked={isLocationsActive}
              onCheckedChange={onToggleLocations}
              disabled={isLoading}
            />
          </div>

          {isLoading && (
            <p className="text-xs text-slate-500 animate-pulse">
              Carregando dados...
            </p>
          )}
          {hasFetched && dataCount > 0 && (
            <p className="text-xs text-slate-500">
              {dataCount} registros encontrados.
            </p>
          )}
          {hasFetched && dataCount === 0 && !isLoading && (
            <p className="text-xs text-amber-600">
              Nenhum registro encontrado com coordenadas.
            </p>
          )}
        </div>
      )}
    </FilterPopover>
  )
}
