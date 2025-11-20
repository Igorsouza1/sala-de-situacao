"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronUp,
  ChevronDown,
  NotebookPen,
  Zap,
  CheckSquare,
  Square,
  ChevronRight
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"
import { GroupedActionCategory } from "./config/actions-config"

interface ActionsLayerCardProps {
  title: string
  categories: GroupedActionCategory[]
  visibleActionTypes: string[] // Array of "Category:Type"
  onToggleType: (categoryId: string, typeId: string, isChecked: boolean) => void
  onToggleCategory: (categoryId: string, isChecked: boolean) => void
}

export function ActionsLayerCard({ 
  title, 
  categories, 
  visibleActionTypes, 
  onToggleType, 
  onToggleCategory 
}: ActionsLayerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    )
  }

  const activeActionsCount = visibleActionTypes.length
  const totalActionsCount = categories.reduce((acc, cat) => acc + cat.count, 0)

  return (
    <Card className="w-80 bg-pantaneiro-green shadow-xl z-[1000] overflow-hidden border-0">
      <CardHeader className="p-4 bg-pantaneiro-green border-b border-pantaneiro-lime/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pantaneiro-lime rounded-lg flex items-center justify-center">
              <NotebookPen className="w-4 h-4 text-pantaneiro-green" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                {title}
                <Zap className="w-4 h-4 text-pantaneiro-lime" />
              </CardTitle>
              <p className="text-xs text-white/80">
                {activeActionsCount} de {totalActionsCount} ações ativas
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpand}
            className="text-white hover:bg-pantaneiro-lime hover:bg-opacity-20 h-8 w-8 p-0"
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
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CardContent className="p-4 bg-pantaneiro-green">
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pantaneiro-lime/30 scrollbar-track-transparent">
                {categories.map((category) => {
                  const isCatExpanded = expandedCategories.includes(category.id)
                  const CategoryIcon = category.icon
                  
                  // Check if all types in this category are selected
                  const allTypesSelected = category.types.every(t => 
                    visibleActionTypes.includes(`${category.id}:${t.id}`)
                  )
                  const someTypesSelected = category.types.some(t => 
                    visibleActionTypes.includes(`${category.id}:${t.id}`)
                  )
                  const isIndeterminate = someTypesSelected && !allTypesSelected

                  return (
                    <div key={category.id} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                      {/* Category Header */}
                      <div className="flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleCategoryExpand(category.id)}>
                          {isCatExpanded ? <ChevronDown className="w-4 h-4 text-white/60" /> : <ChevronRight className="w-4 h-4 text-white/60" />}
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}30`, color: category.color }}
                          >
                            <CategoryIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-white">{category.label}</span>
                          <Badge variant="secondary" className="ml-auto bg-white/10 text-white/60 text-[10px] h-5 px-1.5">
                            {category.count}
                          </Badge>
                        </div>
                        
                        {/* Bulk Action for Category */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2 text-white/60 hover:text-pantaneiro-lime"
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleCategory(category.id, !allTypesSelected)
                          }}
                          title={allTypesSelected ? "Desmarcar todos" : "Marcar todos"}
                        >
                          {allTypesSelected ? (
                            <CheckSquare className="w-4 h-4 text-pantaneiro-lime" />
                          ) : isIndeterminate ? (
                            <div className="relative w-4 h-4 flex items-center justify-center">
                                <Square className="w-4 h-4" />
                                <div className="absolute w-2 h-2 bg-pantaneiro-lime rounded-[1px]" />
                            </div>
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Types List (Accordion Content) */}
                      <AnimatePresence>
                        {isCatExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 space-y-1 bg-black/20">
                              {category.types.map((type) => {
                                const uniqueId = `${category.id}:${type.id}`
                                const isChecked = visibleActionTypes.includes(uniqueId)
                                
                                return (
                                  <div 
                                    key={type.id} 
                                    className="flex items-center justify-between p-1.5 rounded hover:bg-white/5 pl-8"
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Checkbox
                                        id={uniqueId}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => onToggleType(category.id, type.id, checked as boolean)}
                                        className="w-3.5 h-3.5 border-white/30 data-[state=checked]:bg-pantaneiro-lime data-[state=checked]:border-pantaneiro-lime data-[state=checked]:text-pantaneiro-green"
                                      />
                                      <Label
                                        htmlFor={uniqueId}
                                        className="text-xs text-white/80 cursor-pointer select-none flex-1 truncate"
                                      >
                                        {type.label === "null" ? "Não Informado" : type.label}
                                      </Label>
                                    </div>
                                    <span className="text-[10px] text-white/40">{type.count}</span>
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
