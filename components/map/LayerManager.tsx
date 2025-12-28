"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Globe, Eye, EyeOff, Flame, Waves, Activity, Leaf, MapPin, Layers } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"


// pq temos layermanager aqui? nao temos um DTO com isso?

export interface LayerManagerOption {
  id: string
  label: string
  color: string
  slug: string
  fillColor?: string
  icon?: string
  legendType?: 'point' | 'line' | 'polygon' | 'circle'
  category?: string
}

interface LayerManagerProps {
  title?: string
  options: LayerManagerOption[]
  activeLayers: string[]
  onLayerToggle: (slug: string, isChecked: boolean) => void
  onToggleAll: (isChecked: boolean) => void
}

const getLayerIcon = (iconName?: string) => {
    switch (iconName) {
        case "flame": return Flame;
        case "fire": return Flame;
        case "waves": return Waves;
        case "water": return Waves;
        case "activity": return Activity;
        case "leaf": return Leaf;
        default: return Layers; // Default generic icon
    }
}

const CATEGORY_ORDER = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura'];
const DEFAULT_EXPANDED = ['Operacional', 'Monitoramento'];

export function LayerManager({ 
  title = "Camadas", 
  options, 
  activeLayers, 
  onLayerToggle,
  onToggleAll 
}: LayerManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(DEFAULT_EXPANDED)

  const toggleExpand = () => setIsExpanded(!isExpanded)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Discretize options by category
  const groupedOptions = useMemo(() => {
    const groups: Record<string, LayerManagerOption[]> = {};
    
    options.forEach(opt => {
        const cat = opt.category || "Outros";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(opt);
    });

    // Sort categories based on predefined order
    const sortedCategories = Object.keys(groups).sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a);
        const indexB = CATEGORY_ORDER.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Prioritize mostly based on order
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    return sortedCategories.map(cat => ({
        name: cat,
        items: groups[cat]
    }));
  }, [options]);

  return (
    <Card className="w-80 max-w-sm bg-brand-dark/95 backdrop-blur-md shadow-2xl z-[1000] overflow-hidden border border-white/10 transition-all duration-300">
      <CardHeader className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-brand-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2 truncate">
                {title}
              </CardTitle>
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
              <div className="max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                
                {groupedOptions.map(group => {
                    const isCatExpanded = expandedCategories.includes(group.name);
                    
                    return (
                    <div key={group.name} className="mb-2 last:mb-0 border border-white/5 rounded-lg overflow-hidden bg-white/[0.02]">
                        {/* Accordion Header */}
                        <div 
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-white/5 transition-colors select-none"
                            onClick={() => toggleCategory(group.name)}
                        >
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                {group.name}
                                <Badge variant="secondary" className="bg-white/10 text-slate-300 text-[10px] h-4 px-1 rounded-sm">
                                    {group.items.length}
                                </Badge>
                            </h4>
                            {isCatExpanded ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
                        </div>

                        <AnimatePresence>
                            {isCatExpanded && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-2 pt-0 space-y-1.5 border-t border-white/5">
                                        {group.items.map((option, index) => {
                                        const isChecked = activeLayers.includes(option.slug)
                                        const IconComponent = getLayerIcon(option.icon)
                                        const legendType = option.legendType || 'polygon'; 

                                        return (
                                            <motion.div
                                            key={option.id}
                                            initial={{ opacity: 0, x: -4 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.02 }}
                                            className={`group flex items-center justify-between rounded-md border transition-colors duration-150 px-2 py-1.5 ${
                                                isChecked
                                                ? "bg-brand-primary/10 border-brand-primary/20"
                                                : "bg-transparent border-transparent hover:bg-white/5"
                                            }`}
                                            >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <Checkbox
                                                id={option.id}
                                                checked={isChecked}
                                                onCheckedChange={(checked) => onLayerToggle(option.slug, checked as boolean)}
                                                className="w-3.5 h-3.5 border-slate-600 data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:text-white flex-shrink-0"
                                                />

                                    {legendType === 'point' && (
                                        <div 
                                            className="h-5 w-5 rounded flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/10"
                                            style={{ borderColor: isChecked ? option.color : 'rgba(255,255,255,0.1)' }}
                                        >
                                            <IconComponent 
                                                size={12} 
                                                style={{ color: option.color }} 
                                            />
                                        </div>
                                    )}

                                    {legendType === 'line' && (
                                        <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                                            <svg width="20" height="20" viewBox="0 0 20 20" className="opacity-80">
                                                <path 
                                                    d="M2 15 C 8 15, 12 5, 18 5" 
                                                    fill="none" 
                                                    stroke={option.color} 
                                                    strokeWidth="2.5" 
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    {legendType === 'circle' && (
                                        <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                                            <span
                                                className="h-3 w-3 rounded-full shadow-sm ring-2 ring-inset"
                                                style={{ 
                                                    borderColor: option.color,
                                                    backgroundColor: option.color
                                                }}
                                            />
                                        </div>
                                    )}

                                    {legendType === 'polygon' && (
                                        <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                                            <span
                                                className="h-3 w-3 rounded-[2px] shadow-sm ring-1 ring-white/20"
                                                style={{ 
                                                    backgroundColor: option.fillColor || option.color, // Fill
                                                    borderColor: option.color
                                                }}
                                            />
                                        </div>
                                    )}

                                                <Label
                                                htmlFor={option.id}
                                                className="text-ls text-slate-300 cursor-pointer select-none flex-1 truncate font-normal"
                                                >
                                                {option.label}
                                                </Label>
                                            </div>

                                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    )
                })}
              </div>

              {/* Quick Actions */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAll(true)}
                    className="flex-1 text-xs border-white/10 text-slate-300 bg-white/5 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/20"
                  >
                    Mostrar Todas
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAll(false)}
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
