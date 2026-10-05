"use client"

import { useState, useMemo } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronUp, ChevronDown, Layers } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"


// pq temos layermanager aqui? nao temos um DTO com isso?

export interface LayerManagerOption {
  id: string
  label: string
  color: string
  slug: string
  fillColor?: string
  icon?: string
  legendType?: 'point' | 'line' | 'polygon' | 'circle' | 'icon' | 'heatmap'
  category?: string
  subOptions?: LayerManagerOption[]
}

interface LayerManagerProps {
  options: LayerManagerOption[]
  activeLayers: string[]
  onLayerToggle: (slug: string, isChecked: boolean) => void
  onToggleAll: (isChecked: boolean) => void
  onGroupToggle?: (slugs: string[], isChecked: boolean) => void
  /** andamento por camada, pela chave da camada-mãe (DESIGN.md 2.1: cada fonte mostra o seu) */
  status?: Record<string, LayerStatus>
  onRetry?: (slug: string) => void
  /** o catálogo ainda está chegando */
  loading?: boolean
}

export type LayerStatus = 'loading' | 'error'

// Estado de uma camada ao lado do nome: esqueleto enquanto chega; frase e saída se falhou (2.1).
function StatusHint({ status, slug, onRetry }: { status?: LayerStatus; slug: string; onRetry?: (slug: string) => void }) {
  if (status === 'loading') {
    return (
      <span role="status" className="flex shrink-0 items-center">
        <span className="bg-shimmer h-2 w-10 rounded-sm" aria-hidden />
        <span className="sr-only">Carregando</span>
      </span>
    )
  }
  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRetry?.(slug) }}
        className="shrink-0 text-xs text-crit underline underline-offset-2 hover:text-crit/80"
      >
        Não carregou. Tentar de novo
      </button>
    )
  }
  return null
}

const toPascalCase = (str: string) => {
  return str
    .replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    })
    .replace(/^./, (str) => str.toUpperCase());
};

const getLayerIcon = (iconName?: string) => {
    if (!iconName) return Layers;

    const pascalName = toPascalCase(iconName);
    // @ts-ignore
    const IconComponent = LucideIcons[pascalName];

    return IconComponent || Layers;
}

const CATEGORY_ORDER = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura'];
const DEFAULT_EXPANDED = ['Operacional', 'Monitoramento'];

function LayerOptionItem({ option, isChecked, onToggle, index, isSubOption, status, onRetry }: { option: LayerManagerOption, isChecked: boolean, onToggle: () => void, index: number, isSubOption?: boolean, status?: LayerStatus, onRetry?: (slug: string) => void }) {
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
            ? "bg-secondary border-transparent"
            : "bg-transparent border-transparent hover:bg-muted"
        }`}
        >
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <Checkbox
            id={option.id}
            checked={isChecked}
            onCheckedChange={onToggle}
            className="shrink-0"
            />

            {legendType === 'point' && (
                <div 
                    className="h-5 w-5 rounded flex items-center justify-center shrink-0 bg-card border border-border"
                    style={{ borderColor: isChecked ? option.color : undefined }}
                >
                    <IconComponent 
                        size={12} 
                        style={{ color: option.color }} 
                    />
                </div>
            )}

            {legendType === 'line' && (
                <div className="h-5 w-5 flex items-center justify-center shrink-0">
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
                <div className="h-5 w-5 flex items-center justify-center shrink-0">
                    <span
                        className="h-3 w-3 rounded-full shadow-xs ring-2 ring-inset"
                        style={{ 
                            borderColor: option.color,
                            backgroundColor: option.color
                        }}
                    />
                </div>
            )}

            {legendType === 'polygon' && (
                <div className="h-5 w-5 flex items-center justify-center shrink-0">
                    <span
                        className="h-3 w-3 rounded-[2px] shadow-xs ring-1 ring-border"
                        style={{ 
                            backgroundColor: option.fillColor || option.color, // Fill
                            borderColor: option.color
                        }}
                    />
                </div>
            )}

            {legendType === 'heatmap' && (
                <div className="h-5 w-5 flex items-center justify-center shrink-0">
                     <div 
                        className="h-3 w-3 rounded-sm shadow-xs"
                        style={{
                            background: `linear-gradient(135deg, ${option.color || 'red'} 0%, transparent 100%)`, 
                            border: '1px solid var(--color-border)'
                        }}
                     />
                </div>
            )}

            {legendType === 'icon' && (
                <div 
                    className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-card border border-border"
                    style={{ borderColor: isChecked ? option.color : undefined }}
                >
                    <IconComponent 
                        size={12} 
                        style={{ color: option.color }} 
                    />
                </div>
            )}

            <Label
            htmlFor={option.id}
            className="text-sm text-foreground cursor-pointer select-none flex-1 truncate font-normal"
            >
            {option.label}
            </Label>
            <StatusHint status={isChecked ? status : undefined} slug={option.slug} onRetry={onRetry} />
        </div>
        </motion.div>
    )
}

export function LayerManager({ 
  options, 
  activeLayers, 
  onLayerToggle,
  onToggleAll,
  onGroupToggle,
  status,
  onRetry,
  loading,
}: LayerManagerProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(DEFAULT_EXPANDED)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  
  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

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

  if (options.length === 0) {
    return loading ? (
      <div role="status" className="space-y-2">
        <p className="text-sm text-muted-foreground">Buscando as camadas…</p>
        {[0, 1, 2, 3].map((i) => <div key={i} className="bg-shimmer h-7 rounded-md" aria-hidden />)}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Ainda não há camadas para esta região.</p>
    )
  }

  return (
    <div>
      <div>
                {groupedOptions.map(group => {
                    const isCatExpanded = expandedCategories.includes(group.name);
                    
                    return (
                    <div key={group.name} className="mb-2 last:mb-0 border border-border rounded-lg overflow-hidden">
                        {/* Accordion Header */}
                        <div 
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted transition-colors select-none"
                            onClick={() => toggleCategory(group.name)}
                        >
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                {group.name}
                                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                    {group.items.length}
                                </Badge>
                            </h4>
                            {isCatExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
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
                                    <div className="p-2 pt-0 space-y-1.5 border-t border-border">
                                        {group.items.map((option, index) => {
                                        // CHECK FOR SUB-OPTIONS (NESTED LAYER)
                                        if (option.subOptions && option.subOptions.length > 0) {
                                            const isItemExpanded = expandedItems.includes(option.id);
                                            // Check if ANY child is active to show visual cue on parent?
                                            // Or maybe an "indetermined" state checkbox?
                                            // For now: Just a folder header.

                                            // Helper to count active children
                                            const activeChildrenCount = option.subOptions.filter(sub => activeLayers.includes(sub.slug)).length;
                                            const allChildrenCount = option.subOptions.length;
                                            const isAllSelected = activeChildrenCount === allChildrenCount;
                                            const isNoneSelected = activeChildrenCount === 0;

                                            const handleGroupCheckbox = (e: React.MouseEvent) => {
                                                e.stopPropagation(); // Prevent toggling expansion
                                                if (onGroupToggle) {
                                                    const allSlugs = option.subOptions?.map(s => s.slug) || [];
                                                    if (isAllSelected) {
                                                        // Uncheck all
                                                        onGroupToggle(allSlugs, false);
                                                    } else {
                                                        // Check all
                                                        onGroupToggle(allSlugs, true);
                                                    }
                                                }
                                            };

                                            return (
                                                <div key={option.id} className="rounded-md border border-border bg-muted overflow-hidden">
                                                    <div
                                                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-secondary transition-colors"
                                                        onClick={() => toggleItem(option.id)}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            
                                                            <Checkbox
                                                                id={`group-${option.id}`}
                                                                checked={isAllSelected}
                                                                // @ts-ignore
                                                                onClick={handleGroupCheckbox}
                                                                className={`shrink-0 ${!isAllSelected && !isNoneSelected ? 'opacity-50' : ''}`}
                                                            />

                                                            {/* Optional: Icon for the group */}
                                                            {option.icon && (
                                                                <div className="text-muted-foreground">
                                                                   {(() => { const I = getLayerIcon(option.icon); return <I size={14} /> })()}
                                                                </div>
                                                            )}

                                                            <span className="text-sm font-medium text-foreground truncate">
                                                                {option.label}
                                                            </span>

                                                            <StatusHint status={activeChildrenCount > 0 ? status?.[option.slug] : undefined} slug={option.slug} onRetry={onRetry} />

                                                            {/* Badge if children active */}
                                                            {activeChildrenCount > 0 && (
                                                                <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                                                                    {activeChildrenCount}/{allChildrenCount}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {isItemExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                                                    </div>

                                                    <AnimatePresence>
                                                        {isItemExpanded && (
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: "auto" }}
                                                                exit={{ height: 0 }}
                                                                className="overflow-hidden bg-card"
                                                            >
                                                                <div className="p-2 space-y-1.5 border-t border-border">
                                                                    {option.subOptions.map((sub, subIdx) => (
                                                                        <LayerOptionItem
                                                                            key={sub.id}
                                                                            option={sub}
                                                                            isChecked={activeLayers.includes(sub.slug)}
                                                                            onToggle={() => onLayerToggle(sub.slug, !activeLayers.includes(sub.slug))}
                                                                            index={subIdx}
                                                                            isSubOption={true}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )
                                        }

                                        // STANDARD ITEM
                                        return (
                                            <LayerOptionItem
                                                key={option.id}
                                                option={option}
                                                isChecked={activeLayers.includes(option.slug)}
                                                onToggle={() => onLayerToggle(option.slug, !activeLayers.includes(option.slug))}
                                                index={index}
                                                status={status?.[option.slug]}
                                                onRetry={onRetry}
                                            />
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
      <div className="mt-3 pt-3 border-t border-border">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAll(true)}
                    className="flex-1 text-xs"
                  >
                    Mostrar Todas
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleAll(false)}
                    className="flex-1 text-xs"
                  >
                    Ocultar Todas
                  </Button>
                </div>
      </div>
    </div>
  )
}
