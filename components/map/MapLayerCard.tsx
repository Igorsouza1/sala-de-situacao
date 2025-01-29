"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Boxes } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LayerOption {
  id: string
  label: string
}

interface MapLayersCardProps {
  title: string
  options: LayerOption[]
  onLayerToggle: (id: string, isChecked: boolean) => void
}

export function MapLayersCard({ title, options, onLayerToggle }: MapLayersCardProps) {
  const [checkedLayers, setCheckedLayers] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(true)

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckedLayers((prev) => (checked ? [...prev, id] : prev.filter((layerId) => layerId !== id)))
    onLayerToggle(id, checked)
  }

  const toggleExpand = () => setIsExpanded(!isExpanded)

  return (
    <Card className="w-64 bg-white shadow-md z-[1000] overflow-hidden">
      <CardHeader className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Boxes className="w-5 h-5 mr-2" />
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
                    />
                    <Label htmlFor={option.id} className="text-sm font-medium leading-none cursor-pointer select-none">
                      {option.label}
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

