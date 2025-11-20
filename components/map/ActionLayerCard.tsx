"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, NotebookPen, CheckSquare, Square, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { GroupedActionCategory } from "./config/actions-config"

interface ActionsLayerCardProps {
  title: string
  categories: GroupedActionCategory[]
  visibleActionTypes: string[]
  onToggleType: (categoryId: string, typeId: string, isChecked: boolean) => void
  onToggleCategory: (categoryId: string, isChecked: boolean) => void
}

export function ActionsLayerCard({
  title,
  categories,
  visibleActionTypes,
  onToggleType,
  onToggleCategory,
}: ActionsLayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [hoveredType, setHoveredType] = useState<string | null>(null)

  const toggleExpand = () => setIsExpanded((prev) => !prev)

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    )
  }

  const activeActionsCount = visibleActionTypes.length
  const totalActionsCount = categories.reduce((acc, cat) => acc + cat.count, 0)

  return (
    <Card className="w-full max-w-sm bg-emerald-950/70 backdrop-blur-md shadow-xl z-[1000] overflow-hidden border border-white/10">
      <CardHeader className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-8 w-8 rounded-full border border-emerald-400/40 bg-emerald-900/60 flex items-center justify-center flex-shrink-0">
              <NotebookPen className="w-4 h-4 text-emerald-100" />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-emerald-50">
                {title}
              </CardTitle>
              <p className="text-sm text-emerald-200/90 mt-0.5">
                  Mostrando{" "}
                  <span className="font-semibold text-emerald-100">{activeActionsCount}</span>{" "}
                  de{" "}
                  <span className="font-semibold text-emerald-100">{totalActionsCount}</span>{" "}
                  ações
                </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className="h-8 w-8 p-0 rounded-full text-emerald-100 hover:bg-emerald-800/70"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Fechar ações" : "Abrir ações"}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                {categories.map((category) => {
                  const isCatExpanded = expandedCategories.includes(category.id)
                  const CategoryIcon = category.icon

                  const allTypesSelected = category.types.every((t) =>
                    visibleActionTypes.includes(`${category.id}:${t.id}`),
                  )
                  const someTypesSelected = category.types.some((t) =>
                    visibleActionTypes.includes(`${category.id}:${t.id}`),
                  )
                  const isIndeterminate = someTypesSelected && !allTypesSelected

                  return (
                    <div
                      key={category.id}
                      className="rounded-md border border-white/5 bg-emerald-950/40 hover:bg-emerald-900/40 transition-colors duration-150"
                    >
                      {/* Linha principal da categoria (parece layer de mapa) */}
                      <div className="flex items-center justify-between px-2.5 py-2">
                        <button
                          onClick={() => toggleCategoryExpand(category.id)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                          aria-expanded={isCatExpanded}
                          aria-label={`${isCatExpanded ? "Recolher" : "Expandir"} ${category.label}`}
                        >
                          <motion.div
                            animate={{ rotate: isCatExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex-shrink-0"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-300/80" />
                          </motion.div>

                          {/* Dot colorido sincronizado com o mapa */}
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />

                          {/* Ícone opcional, bem discreto */}
                          <div className="h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 bg-emerald-900/60 border border-white/5">
                            <CategoryIcon className="w-3.5 h-3.5 text-emerald-100" />
                          </div>

                          <span className="text-sm font-medium text-emerald-50 truncate">
                            {category.label}
                          </span>

                          <Badge
                            className="ml-auto bg-emerald-900/80 text-emerald-100 text-sm h-5 px-2"
                          >
                            {category.count}
                            </Badge>
                          </button>

                        {/* Toggle de layer (marcar/desmarcar todos) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 ml-1 rounded-full text-emerald-100 hover:bg-emerald-800/70 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleCategory(category.id, !allTypesSelected)
                          }}
                          title={allTypesSelected ? "Ocultar categoria no mapa" : "Mostrar categoria no mapa"}
                          aria-label={allTypesSelected ? "Ocultar categoria no mapa" : "Mostrar categoria no mapa"}
                        >
                          {allTypesSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : isIndeterminate ? (
                            <div className="relative w-4 h-4 flex items-center justify-center">
                              <Square className="w-4 h-4" />
                              <div className="absolute w-1.5 h-1.5 bg-emerald-200 rounded-sm" />
                            </div>
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Tipos internos (sub-filtro), visual mais leve */}
                      <AnimatePresence>
                        {isCatExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden border-t border-white/5"
                          >
                            <div className="px-2.5 py-2 space-y-1 bg-black/40">
                              {category.types.map((type) => {
                                const uniqueId = `${category.id}:${type.id}`
                                const isChecked = visibleActionTypes.includes(uniqueId)
                                const isHovered = hoveredType === uniqueId

                                return (
                                  <div
                                    key={type.id}
                                    onMouseEnter={() => setHoveredType(uniqueId)}
                                    onMouseLeave={() => setHoveredType(null)}
                                    className={`flex items-center justify-between rounded-md px-2 py-1.5 pl-7 cursor-pointer transition-colors ${
                                      isHovered
                                        ? "bg-emerald-900/70"
                                        : isChecked
                                          ? "bg-emerald-900/50"
                                          : "hover:bg-emerald-900/40"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Checkbox
                                        id={uniqueId}
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                          onToggleType(category.id, type.id, checked as boolean)
                                        }
                                        className="w-4 h-4 border-emerald-400/70 data-[state=checked]:bg-emerald-300 data-[state=checked]:border-emerald-300 data-[state=checked]:text-emerald-950 flex-shrink-0"
                                        aria-label={`${type.label === "null" ? "Não Informado" : type.label}`}
                                      />
                                      <Label
                                        htmlFor={uniqueId}
                                        className="text-sm text-emerald-50 cursor-pointer select-none flex-1 truncate"
                                      >
                                        {type.label === "null" ? "Não Informado" : type.label}
                                      </Label>
                                    </div>
                                    <span className="text-sm text-emerald-200/80 font-medium ml-2 flex-shrink-0">
                                      {type.count}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
