"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react" // Added import for React

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
  Fazenda: <Home className="w-4 h-4 text-black" />,
  "Passivo Ambiental": <AlertTriangle className="w-4 h-4 text-black" />,
  Pesca: <Fish className="w-4 h-4 text-black" />,
  "Pesca - Crime Ambiental": <Anchor className="w-4 h-4 text-black" />,
  "Ponto de Referência": <MapPin className="w-4 h-4 text-black" />,
  "Crime Ambiental": <Skull className="w-4 h-4 text-black" />,
  Nascente: <Droplet className="w-4 h-4 text-black" />,
  Plantio: <Sprout className="w-4 h-4 text-black" />,
  "Régua Fluvial": <Ruler className="w-4 h-4 text-black" />,
}

export function ActionsLayerCard({ title, options, onLayerToggle }: ActionsLayerCardProps) {
  const [checkedLayers, setCheckedLayers] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedLayers((prev) => (checked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
    onLayerToggle(id, checked)
  }

  const toggleExpand = () => setIsExpanded(!isExpanded)

  return (
    <Card className="w-72 bg-pantaneiro-green text-white shadow-md z-[1000] overflow-hidden">
      <CardHeader className="p-4 bg-pantaneiro-green">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <NotebookPen className="w-5 h-5 mr-2" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={toggleExpand}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.id}
                      checked={checkedLayers.includes(option.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(option.id, checked as boolean)}
                      className="w-5 h-5 border-2 border-gray-200 rounded-md text-black focus:ring-2  checked:bg-black checked:border-black"
                    />
                    <Label
                      htmlFor={option.id}
                      className="text-sm font-medium leading-none cursor-pointer select-none flex items-center"
                    >
                      <div className="w-4 h-4 mr-2 flex items-center justify-center" style={{ color: option.color }}>
                        {actionIcons[option.label] || <NotebookPen className="w-4 h-4" />}
                      </div>
                      {option.label}
                      <span className="ml-2 px-2 py-1 bg-gray-400 rounded-full text-xs">{option.count}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

