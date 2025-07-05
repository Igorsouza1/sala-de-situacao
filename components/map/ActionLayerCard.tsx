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
  Home,
  AlertTriangle,
  Fish,
  Anchor,
  MapPin,
  Skull,
  Droplet,
  Sprout,
  Ruler,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"

interface ActionOption {
  id: string
  label: string
  count: number
  color: string
  icon?: React.ReactNode
}

interface ActionsLayerCardProps {
  title: string
  options: ActionOption[]
  onLayerToggle: (id: string, isChecked: boolean) => void
}

const actionIcons: { [key: string]: React.ReactNode } = {
  Fazenda: <Home className="w-4 h-4" />,
  "Passivo Ambiental": <AlertTriangle className="w-4 h-4" />,
  Pesca: <Fish className="w-4 h-4" />,
  "Pesca - Crime Ambiental": <Anchor className="w-4 h-4" />,
  "Ponto de Referência": <MapPin className="w-4 h-4" />,
  "Crime Ambiental": <Skull className="w-4 h-4" />,
  Nascente: <Droplet className="w-4 h-4" />,
  Plantio: <Sprout className="w-4 h-4" />,
  "Régua Fluvial": <Ruler className="w-4 h-4" />,
}

export function ActionsLayerCard({ title, options, onLayerToggle }: ActionsLayerCardProps) {
  const [checkedLayers, setCheckedLayers] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedLayers((prev) => (checked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
    onLayerToggle(id, checked)
  }

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const activeActionsCount = checkedLayers.length
  const totalActionsCount = options.length

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
              <div className="space-y-3">
                {options.map((option, index) => {
                  const isChecked = checkedLayers.includes(option.id)
                  return (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                        isChecked
                          ? "bg-pantaneiro-lime/20 border-pantaneiro-lime/40 shadow-sm"
                          : "bg-white/5 border-white/10 hover:bg-pantaneiro-lime/10 hover:border-pantaneiro-lime/20"
                      }`}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <Checkbox
                          id={option.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
                          className="w-4 h-4 border-2 border-pantaneiro-lime/50 data-[state=checked]:bg-pantaneiro-lime data-[state=checked]:border-pantaneiro-lime data-[state=checked]:text-pantaneiro-green"
                        />
                        <Label
                          htmlFor={option.id}
                          className="text-sm font-medium leading-none cursor-pointer select-none flex items-center flex-1"
                        >
                          <div
                            className="w-6 h-6 mr-3 rounded-lg border border-pantaneiro-lime/30 shadow-sm flex items-center justify-center text-pantaneiro-lime"
                            style={{ backgroundColor: `${option.color}20` }}
                          >
                            {actionIcons[option.label] || <NotebookPen className="w-4 h-4" />}
                          </div>
                          <span className="text-white group-hover:text-pantaneiro-lime transition-colors">
                            {option.label}
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-pantaneiro-lime/20 text-pantaneiro-lime border-pantaneiro-lime/30 text-xs px-2 py-1"
                        >
                          {option.count}
                        </Badge>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {isChecked ? (
                            <Eye className="h-3 w-3 text-pantaneiro-lime" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-white/40" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-4 pt-4 border-t border-pantaneiro-lime/20">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = options.map((opt) => opt.id)
                      setCheckedLayers(allIds)
                      allIds.forEach((id) => onLayerToggle(id, true))
                    }}
                    className="flex-1 text-xs border-pantaneiro-lime/30 text-white hover:bg-pantaneiro-lime hover:bg-opacity-20 hover:text-pantaneiro-lime hover:border-pantaneiro-lime"
                  >
                    Ativar Todas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCheckedLayers([])
                      options.forEach((opt) => onLayerToggle(opt.id, false))
                    }}
                    className="flex-1 text-xs border-pantaneiro-lime/30 text-white hover:bg-pantaneiro-lime hover:bg-opacity-20 hover:text-pantaneiro-lime hover:border-pantaneiro-lime"
                  >
                    Desativar Todas
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
