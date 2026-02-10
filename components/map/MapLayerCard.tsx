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
    <Card className="w-80 max-w-sm bg-brand-dark/95 backdrop-blur-md shadow-2xl z-[1000] overflow-hidden border border-white/10 transition-all duration-300">
      <CardHeader className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
              <Layers className="w-4 h-4 text-brand-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2 truncate">
                {title}
                <Leaf className="w-4 h-4 text-brand-primary/80" />
              </CardTitle>

              <p className="text-sm text-slate-400 mt-0.5">
                Mostrando{" "}
                <span className="font-semibold text-brand-primary">{activeLayersCount}</span>{" "}
                de{" "}
                <span className="font-semibold text-brand-primary">{totalLayersCount}</span>{" "}
                camadas
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
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
              <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {options.map((option, index) => {
                  const isChecked = checkedLayers.includes(option.id)

                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`group flex items-center justify-between rounded-lg border transition-colors duration-150 px-2.5 py-2 ${
                        isChecked
                          ? "bg-brand-primary/5 border-brand-primary/20"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Checkbox
                          id={option.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
                          className="w-4 h-4 border-slate-600 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:text-white flex-shrink-0"
                        />

                        {/* dot da cor da camada */}
                        <span
                          className="h-3 w-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                          style={{ backgroundColor: option.color }}
                        />

                        <Label
                          htmlFor={option.id}
                          className="text-sm text-slate-300 cursor-pointer select-none flex-1 truncate font-normal"
                        >
                          {option.label}
                        </Label>
                      </div>

                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <Badge className="bg-brand-dark-blue text-brand-primary border border-brand-primary/20 text-xs h-5 px-1.5">
                          {option.count}
                        </Badge>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isChecked ? (
                            <Eye className="h-3 w-3 text-brand-primary" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-slate-600" />
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
                    className="flex-1 text-xs border-white/10 text-slate-300 bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/20"
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
                    className="flex-1 text-xs border-white/10 text-slate-300 bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/20"
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
