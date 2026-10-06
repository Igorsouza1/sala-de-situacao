"use client"

import { useMemo, useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp, Layers } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { filterLine, type FilterNote } from "./helpers/layers"

// Lista de camadas (DESIGN.md 13.1): plana, com rótulos de seção sempre visíveis (nada de acordeão: são poucas linhas).
// Cada linha: amostra da cor (é a legenda) · nome · quantas feições há no mapa · interruptor. A linha toda liga e desliga.

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

export type LayerStatus = 'loading' | 'error'

interface LayerManagerProps {
  options: LayerManagerOption[]
  activeLayers: string[]
  onLayerToggle: (slug: string, isChecked: boolean) => void
  onHideAll: () => void
  onGroupToggle?: (slugs: string[], isChecked: boolean) => void
  /** andamento por camada, pela chave da camada-mãe (2.1: cada fonte mostra o seu) */
  status?: Record<string, LayerStatus>
  onRetry?: (slug: string) => void
  /** o catálogo ainda está chegando */
  loading?: boolean
  /** quantas feições cada camada tem no mapa, quando já chegou */
  counts?: Record<string, number>
  /** camadas que um filtro está mexendo, e qual */
  filterNotes?: Record<string, FilterNote>
}

const toPascalCase = (str: string) =>
  str.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', '')).replace(/^./, (c) => c.toUpperCase())

const getLayerIcon = (iconName?: string) => {
  if (!iconName) return Layers
  // @ts-ignore
  return LucideIcons[toPascalCase(iconName)] || Layers
}

const CATEGORY_ORDER = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura']

// A amostra mostra a cor e a forma reais da camada; desligada, fica esmaecida.
function Legend({ option, checked }: { option: LayerManagerOption; checked: boolean }) {
  const Icon = getLayerIcon(option.icon)
  const type = option.legendType || 'polygon'
  const fill = option.fillColor || option.color
  return (
    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center transition-opacity duration-180', !checked && 'opacity-40')} aria-hidden>
      {(type === 'point' || type === 'icon') && (
        <span className={cn('flex h-6 w-6 items-center justify-center border bg-card', type === 'icon' ? 'rounded-full' : 'rounded-md')} style={{ borderColor: option.color }}>
          <Icon size={14} style={{ color: option.color }} />
        </span>
      )}
      {type === 'line' && (
        <svg width="22" height="22" viewBox="0 0 20 20">
          <path d="M2 15 C 8 15, 12 5, 18 5" fill="none" stroke={option.color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {type === 'circle' && <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: option.color }} />}
      {type === 'polygon' && <span className="h-3.5 w-3.5 rounded-[3px] border" style={{ backgroundColor: fill, borderColor: option.color }} />}
      {type === 'heatmap' && <span className="h-3.5 w-3.5 rounded-sm" style={{ background: `linear-gradient(135deg, ${option.color || 'red'} 0%, transparent 100%)` }} />}
    </span>
  )
}

interface RowProps {
  option: LayerManagerOption
  checked: boolean
  onChange: (checked: boolean) => void
  count?: number
  status?: LayerStatus
  note?: FilterNote
  onRetry?: (slug: string) => void
  /** botão de expandir, quando a camada tem grupos */
  expander?: ReactNode
  sub?: boolean
}

// A linha inteira é um <label>: clicar em qualquer ponto aciona o interruptor (alvo de 44 px, bom para toque).
// O que não é parte do alvo (frase do filtro, erro com saída) fica fora do <label>, senão o clique ligaria a camada.
function LayerRow({ option, checked, onChange, count, status, note, onRetry, expander, sub }: RowProps) {
  const showCount = !sub && status !== 'loading' && status !== 'error' && count !== undefined
  return (
    <div className={cn(sub && 'ml-5 border-l border-border pl-2')}>
      <div className="flex items-center">
        <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-md px-2 transition-colors duration-180 hover:bg-muted">
          <Legend option={option} checked={checked} />
          <span className={cn('min-w-0 flex-1 truncate text-sm', !checked && 'text-muted-foreground')}>{option.label}</span>
          {status === 'loading' && checked && (
            <span role="status" className="flex shrink-0 items-center">
              <span className="bg-shimmer h-2 w-10 rounded-sm" aria-hidden />
              <span className="sr-only">Carregando</span>
            </span>
          )}
          {showCount && checked && <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{count}</span>}
          <Switch checked={checked} onCheckedChange={onChange} aria-label={option.label} />
        </label>
        {expander}
      </div>
      {checked && status === 'error' && (
        <p className="px-2 pb-1 pl-11 text-xs text-crit">
          Não carregou.{' '}
          <button type="button" onClick={() => onRetry?.(option.slug)} className="underline underline-offset-2 hover:text-crit/80">
            Tentar de novo
          </button>
        </p>
      )}
      {checked && note && status !== 'error' && <p className="px-2 pb-1 pl-11 text-xs text-muted-foreground">{filterLine(note, count)}</p>}
    </div>
  )
}

export function LayerManager({ options, activeLayers, onLayerToggle, onHideAll, onGroupToggle, status, onRetry, loading, counts, filterNotes }: LayerManagerProps) {
  const [expanded, setExpanded] = useState<string[]>([])
  const toggleExpanded = (id: string) => setExpanded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const sections = useMemo(() => {
    const groups: Record<string, LayerManagerOption[]> = {}
    options.forEach((opt) => {
      const cat = opt.category || 'Outros'
      ;(groups[cat] ||= []).push(opt)
    })
    const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length)
    return Object.keys(groups)
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((name) => ({ name, items: groups[name] }))
  }, [options])

  if (options.length === 0) {
    return loading ? (
      <div role="status" className="space-y-2">
        <p className="text-sm text-muted-foreground">Buscando as camadas…</p>
        {[0, 1, 2, 3].map((i) => <div key={i} className="bg-shimmer h-9 rounded-md" aria-hidden />)}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Ainda não há camadas para esta região.</p>
    )
  }

  const isOn = (slug: string) => activeLayers.includes(slug)

  return (
    <div>
      {sections.map((section, i) => (
        <section key={section.name} aria-labelledby={`layers-${i}`}>
          <h5 id={`layers-${i}`} className="px-2 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground first:pt-0">
            {section.name}
          </h5>
          {section.items.map((option) => {
            const subs = option.subOptions
            if (!subs?.length) {
              return (
                <LayerRow
                  key={option.id}
                  option={option}
                  checked={isOn(option.slug)}
                  onChange={(c) => onLayerToggle(option.slug, c)}
                  count={counts?.[option.slug]}
                  status={status?.[option.slug]}
                  note={filterNotes?.[option.slug]}
                  onRetry={onRetry}
                />
              )
            }
            // camada com grupos (ex.: Ações por eixo): o interruptor liga ou desliga todos; o chevron abre os grupos, um nível só
            const slugs = subs.map((s) => s.slug)
            const onCount = slugs.filter(isOn).length
            const open = expanded.includes(option.id)
            return (
              <div key={option.id}>
                <LayerRow
                  option={option}
                  checked={onCount > 0}
                  onChange={(c) => onGroupToggle?.(slugs, c)}
                  count={counts?.[option.slug]}
                  status={status?.[option.slug]}
                  note={filterNotes?.[option.slug]}
                  onRetry={onRetry}
                  expander={
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={`${open ? 'Esconder' : 'Mostrar'} os grupos de ${option.label}`}
                      onClick={() => toggleExpanded(option.id)}
                      className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-180 hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    >
                      {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                      <span className="sr-only">{onCount}/{slugs.length}</span>
                    </button>
                  }
                />
                {open && subs.map((sub) => <LayerRow key={sub.id} sub option={sub} checked={isOn(sub.slug)} onChange={(c) => onLayerToggle(sub.slug, c)} />)}
              </div>
            )
          })}
        </section>
      ))}

      {activeLayers.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={onHideAll}>
            Ocultar todas
          </Button>
        </div>
      )}
    </div>
  )
}
