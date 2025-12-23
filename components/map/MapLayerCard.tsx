"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Layers, Eye, EyeOff, Leaf } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LayerOption {
  id: string
  label: string
  count: number
  color: string
}

interface MapLayersCardProps {
  title: string
  options: LayerOption[]
  onLayerToggle: (id: string, isChecked: boolean) => void
}

export function MapLayersCard({ title, options, onLayerToggle }: MapLayersCardProps) {
  const [checkedLayers, setCheckedLayers] = useState<string[]>([
    "estradas",
    "bacia",
    "leito",
    "desmatamento",
    "propriedades",
    "firms",
    "banhado",
  ])
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedLayers((prev) => (checked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
    onLayerToggle(id, checked)
  }

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const activeLayersCount = checkedLayers.length
  const totalLayersCount = options.length

  return (
    <Card className="w-80 max-w-sm bg-emerald-950/70 backdrop-blur-md shadow-xl z-[1000] overflow-hidden border border-white/10">
      <CardHeader className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full border border-emerald-400/40 bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 text-emerald-100" />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-emerald-50 flex items-center gap-2 truncate">
                {title}
                <Leaf className="w-4 h-4 text-emerald-200/90" />
              </CardTitle>

              <p className="text-sm text-emerald-200/90 mt-0.5">
                Mostrando{" "}
                <span className="font-semibold text-emerald-100">{activeLayersCount}</span>{" "}
                de{" "}
                <span className="font-semibold text-emerald-100">{totalLayersCount}</span>{" "}
                camadas
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className="h-8 w-8 p-0 rounded-full text-emerald-100 hover:bg-emerald-800/70"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Fechar camadas" : "Abrir camadas"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <CardContent className="p-2.5">
              <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-700/60 scrollbar-track-transparent">
                {options.map((option, index) => {
                  const isChecked = checkedLayers.includes(option.id)

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`group flex items-center justify-between rounded-md border transition-colors duration-150 px-2.5 py-2 ${
                        isChecked
                          ? "bg-emerald-900/50 border-white/10"
                          : "bg-emerald-950/40 border-white/5 hover:bg-emerald-900/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Checkbox
                          id={option.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
                          className="w-4 h-4 border-emerald-400/70 data-[state=checked]:bg-emerald-300 data-[state=checked]:border-emerald-300 data-[state=checked]:text-emerald-950 flex-shrink-0"
                        />

                        {/* dot da cor da camada */}
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0 border border-white/10"
                          style={{ backgroundColor: option.color }}
                        />

                        <Label
                          htmlFor={option.id}
                          className="text-sm text-emerald-50 cursor-pointer select-none flex-1 truncate"
                        >
                          {option.label}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <Badge className="bg-emerald-900/80 text-emerald-100 text-sm h-5 px-2">
                          {option.count}
                        </Badge>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isChecked ? (
                            <Eye className="h-3 w-3 text-emerald-200/90" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-emerald-200/40" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Quick Actions (mesma lógica, só re-skin) */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = options.map((opt) => opt.id)
                      setCheckedLayers(allIds)
                      allIds.forEach((id) => onLayerToggle(id, true))
                    }}
                    className="flex-1 text-xs border-white/10 text-emerald-100 bg-emerald-700/60 hover:bg-emerald-900/60 hover:text-emerald-50 hover:border-white/20"
                  >
                    Mostrar Todas
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCheckedLayers([])
                      options.forEach((opt) => onLayerToggle(opt.id, false))
                    }}
                    className="flex-1 text-xs border-white/10 text-emerald-100 bg-emerald-700/60 hover:bg-emerald-900/60 hover:text-emerald-50 hover:border-white/20"
                  >
                    Ocultar Todas
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
