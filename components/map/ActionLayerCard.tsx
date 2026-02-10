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

  const activeActionsCount = categories.reduce((acc, cat) => {
  // filtra os tipos que estão visíveis
  const visibleTypes = cat.types.filter((type) =>
    visibleActionTypes.includes(`${cat.id}:${type.id}`)
  );

  // soma o count de cada tipo visível
  const visibleCount = visibleTypes.reduce((sum, type) => sum + type.count, 0);

  return acc + visibleCount;
}, 0);
  const totalActionsCount = categories.reduce((acc, cat) => acc + cat.count, 0)

  return (
    <Card className="w-full max-w-sm bg-brand-dark/95 backdrop-blur-md shadow-2xl z-[1000] overflow-hidden border border-white/10 transition-all duration-300">
      <CardHeader className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
              <NotebookPen className="w-4 h-4 text-brand-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-slate-100">
                {title}
              </CardTitle>
              <p className="text-sm text-slate-400 mt-0.5">
                  Mostrando{" "}
                  <span className="font-semibold text-brand-primary">{activeActionsCount}</span>{" "}
                  de{" "}
                  <span className="font-semibold text-brand-primary">{totalActionsCount}</span>{" "}
                  ações
                </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleExpand}
            className="h-8 w-8 p-0 rounded-full text-slate-400 hover:bg-white/10 hover:text-white"
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
              <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                      className="rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-150"
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
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          </motion.div>

                          {/* Dot colorido sincronizado com o mapa */}
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                            style={{ backgroundColor: category.color }}
                          />

                          {/* Ícone opcional, bem discreto */}
                          <div className="h-6 w-6 rounded flex items-center justify-center flex-shrink-0 bg-brand-dark border border-white/10">
                            <CategoryIcon className="w-3.5 h-3.5 text-slate-300" />
                          </div>

                          <span className="text-sm font-medium text-slate-200 truncate">
                            {category.label}
                          </span>

                          <Badge
                            className="ml-auto bg-brand-dark-blue text-brand-primary border border-brand-primary/20 text-xs h-5 px-1.5"
                          >
                            {category.count}
                            </Badge>
                          </button>

                        {/* Toggle de layer (marcar/desmarcar todos) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 p-0 ml-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleCategory(category.id, !allTypesSelected)
                          }}
                          title={allTypesSelected ? "Ocultar categoria no mapa" : "Mostrar categoria no mapa"}
                          aria-label={allTypesSelected ? "Ocultar categoria no mapa" : "Mostrar categoria no mapa"}
                        >
                          {allTypesSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-primary" />
                          ) : isIndeterminate ? (
                            <div className="relative w-4 h-4 flex items-center justify-center">
                              <Square className="w-4 h-4" />
                              <div className="absolute w-1.5 h-1.5 bg-brand-primary rounded-[1px]" />
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
                            <div className="px-2.5 py-2 space-y-1 bg-black/20">
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
                                        ? "bg-white/5"
                                        : isChecked
                                          ? "bg-brand-primary/5"
                                          : "hover:bg-white/5"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Checkbox
                                        id={uniqueId}
                                        checked={isChecked}
                                        onCheckedChange={(checked) =>
                                          onToggleType(category.id, type.id, checked as boolean)
                                        }
                                        className="w-4 h-4 border-slate-600 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:text-white flex-shrink-0"
                                        aria-label={`${type.label === "null" ? "Não Informado" : type.label}`}
                                      />
                                      <Label
                                        htmlFor={uniqueId}
                                        className="text-sm text-slate-300 cursor-pointer select-none flex-1 truncate font-normal"
                                      >
                                        {type.label === "null" ? "Não Informado" : type.label}
                                      </Label>
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium ml-2 flex-shrink-0">
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
