"use client"

import { useState } from "react"
import { LandPlot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilterPopover } from "./FilterPopover"

interface PropertyFilterControlProps {
  onFilterChange: (filters: { minArea?: number; maxArea?: number }) => void
}

export function PropertyFilterControl({ onFilterChange }: PropertyFilterControlProps) {
  const [minArea, setMinArea] = useState<string>("")
  const [maxArea, setMaxArea] = useState<string>("")
  const [count, setCount] = useState<number | null>(null)

  async function fetchCount(min?: number, max?: number) {
    const params = new URLSearchParams()
    if (min !== undefined) params.append("minArea", String(min))
    if (max !== undefined) params.append("maxArea", String(max))
    const res = await fetch(`/api/map/propriedades/count?${params}`)
    const data = await res.json()
    setCount(data.count ?? null)
  }

  return (
    <FilterPopover icon={LandPlot} title="Filtros de Propriedade" count={count}>
      {(close) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-slate-600 font-medium">Tamanho da Área (Hectares)</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Mín"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                />
              </div>
              <span className="text-slate-400 text-sm">-</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Máx"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className="h-8 text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          {count != null && (
            <p className="text-xs text-slate-500 text-center">
              <span className="font-semibold text-brand-primary">{count}</span> propriedade{count !== 1 ? "s" : ""} encontrada{count !== 1 ? "s" : ""}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => {
                setMinArea("")
                setMaxArea("")
                setCount(null)
                onFilterChange({ minArea: undefined, maxArea: undefined })
                close()
              }}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-brand-primary hover:bg-blue-600 text-white"
              onClick={async () => {
                const min = minArea ? parseFloat(minArea) : undefined
                const max = maxArea ? parseFloat(maxArea) : undefined
                await fetchCount(min, max)
                onFilterChange({ minArea: min, maxArea: max })
                close()
              }}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </FilterPopover>
  )
}
