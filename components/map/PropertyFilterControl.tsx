"use client"

import { useState } from "react"
import { LandPlot, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PropertyFilterControlProps {
  onFilterChange: (filters: { minArea?: number; maxArea?: number }) => void
}

export function PropertyFilterControl({ onFilterChange }: PropertyFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [minArea, setMinArea] = useState<string>("")
  const [maxArea, setMaxArea] = useState<string>("")

  const handleApply = () => {
    onFilterChange({
      minArea: minArea ? parseFloat(minArea) : undefined,
      maxArea: maxArea ? parseFloat(maxArea) : undefined,
    })
    setIsOpen(false)
  }

  const handleClear = () => {
    setMinArea("")
    setMaxArea("")
    onFilterChange({ minArea: undefined, maxArea: undefined })
    setIsOpen(false)
  }

  return (
    <div className="relative z-[1000]">
      {/* Ícone principal circular */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-white hover:bg-gray-100 shadow-md text-slate-700 border-input rounded-full w-10 h-10 transition-colors ${
          isOpen ? "ring-2 ring-brand-primary ring-offset-2" : ""
        }`}
        title="Filtros de Propriedade"
      >
        <LandPlot className="h-5 w-5" />
      </Button>

      {/* Painel de Filtro com Animação */}
      <div
        className={`absolute left-12 top-0 bg-white border border-slate-200 rounded-lg shadow-xl p-4 w-64 transition-all duration-300 ease-out origin-left ${
          isOpen
            ? "opacity-100 scale-100 translate-x-0"
            : "opacity-0 scale-95 -translate-x-2 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800 text-sm">Filtros de Propriedade</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-slate-800"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

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

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleClear}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs bg-brand-primary hover:bg-blue-600 text-white"
              onClick={handleApply}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
