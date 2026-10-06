"use client"

import { useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronDown, Layers, Pencil } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapse } from "@/components/ui/collapse"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { filterLine, type FilterNote } from "./helpers/layers"

// Lista de camadas (DESIGN.md 13.1): um cartão por categoria, sem acordeão (são poucas linhas).
// Cada linha: amostra (é a legenda, igual ao que o mapa desenha) · nome · quantas feições há no mapa · interruptor.
// A linha inteira liga e desliga.

export interface LayerManagerOption {
  id: string
  label: string
  color: string
  slug: string
  fillColor?: string
  fillOpacity?: number
  icon?: string
  legendType?: 'point' | 'line' | 'polygon' | 'circle' | 'icon' | 'heatmap'
  category?: string
  subOptions?: LayerManagerOption[]
  /** false: não é uma camada do catálogo (ex.: a Fauna) e não tem lápis */
  editable?: boolean
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
  /** quem pode editar camadas passa isto: aparece um lápis em cada linha editável (13.3) */
  onEdit?: (slug: string) => void
}

const toPascalCase = (str: string) =>
  str.replace(/([-_][a-z])/gi, ($1) => $1.toUpperCase().replace('-', '').replace('_', '')).replace(/^./, (c) => c.toUpperCase())

const getLayerIcon = (iconName?: string) => {
  if (!iconName) return Layers
  // @ts-ignore
  return LucideIcons[toPascalCase(iconName)] || Layers
}

const CATEGORY_ORDER = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura']

// Amostra fiel ao mapa: preenchimento, contorno e transparência da camada. Um fio escuro por fora garante que ela apareça
// mesmo quando a cor da camada é clara (a linha das estradas é creme, o contorno das nascentes é branco): sem ele, a legenda
// some no cartão branco e a pessoa precisa adivinhar o que a cor significa. Desligada, a amostra fica esmaecida.
function Legend({ option, checked }: { option: LayerManagerOption; checked: boolean }) {
  const Icon = getLayerIcon(option.icon)
  const type = option.legendType || 'polygon'
  const stroke = option.color
  const fill = option.fillColor || option.color
  const fillOpacity = option.fillOpacity ?? 1
  const hairline = 'ring-1 ring-foreground/25'
  return (
    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center transition-opacity duration-200', !checked && 'opacity-40')} aria-hidden>
      {(type === 'point' || type === 'icon') && (
        <span className={cn('flex h-6 w-6 items-center justify-center border bg-card', type === 'icon' ? 'rounded-full' : 'rounded-md')} style={{ borderColor: stroke }}>
          <Icon size={14} style={{ color: stroke }} />
        </span>
      )}
      {type === 'line' && (
        <svg width="24" height="24" viewBox="0 0 20 20" className="overflow-visible">
          <path d="M2 15 C 8 15, 12 5, 18 5" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" className="text-foreground/25" />
          <path d="M2 15 C 8 15, 12 5, 18 5" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {type === 'circle' && <span className={cn('h-4 w-4 rounded-full border-2', hairline)} style={{ backgroundColor: fill, borderColor: stroke }} />}
      {type === 'polygon' && (
        <span
          className={cn('h-4 w-4 rounded-[3px] border-2', hairline)}
          style={{ backgroundColor: `color-mix(in srgb, ${fill} ${Math.round(fillOpacity * 100)}%, transparent)`, borderColor: stroke }}
        />
      )}
      {type === 'heatmap' && <span className={cn('h-4 w-4 rounded-sm', hairline)} style={{ background: `linear-gradient(135deg, ${option.color || 'red'} 0%, transparent 100%)` }} />}
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
  onEdit?: () => void
}

// A linha inteira é um <label>: clicar em qualquer ponto aciona o interruptor (alvo de 48 px, bom para toque).
// A saída do erro é um botão e fica fora do <label>, senão o clique nela ligaria ou desligaria a camada.
function LayerRow({ option, checked, onChange, count, status, note, onRetry, expander, sub, onEdit }: RowProps) {
  const showCount = !sub && checked && status !== 'loading' && status !== 'error' && count !== undefined
  const showNote = checked && !!note && status !== 'error'
  // a frase fica guardada: ao sumir, a altura encolhe com o texto ainda lá, em vez de o texto sumir e a linha pular
  const lastNote = useRef('')
  if (showNote) lastNote.current = filterLine(note!, count)
  return (
    <div className={cn(sub && 'ml-6 border-l border-border pl-2')}>
      <div className="flex items-center">
        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors duration-200 hover:bg-muted">
          <Legend option={option} checked={checked} />
          <span className="min-w-0 flex-1">
            <span className={cn('block truncate text-sm', !checked && 'text-muted-foreground')}>{option.label}</span>
            <Collapse open={showNote}>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{lastNote.current}</span>
            </Collapse>
          </span>
          {checked && status === 'loading' && (
            <span role="status" className="flex shrink-0 items-center">
              <span className="bg-shimmer h-2 w-10 rounded-sm" aria-hidden />
              <span className="sr-only">Carregando</span>
            </span>
          )}
          {showCount && <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{count}</span>}
          <Switch checked={checked} onCheckedChange={onChange} aria-label={option.label} />
        </label>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${option.label}`}
            title="Editar a camada"
            className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
        {expander}
      </div>
      {checked && status === 'error' && (
        <p className="pb-2 pl-12 pr-2.5 text-xs text-crit">
          Não carregou.{' '}
          <button type="button" onClick={() => onRetry?.(option.slug)} className="underline underline-offset-2 hover:text-crit/80">
            Tentar de novo
          </button>
        </p>
      )}
    </div>
  )
}

export function LayerManager({ options, activeLayers, onLayerToggle, onHideAll, onGroupToggle, status, onRetry, loading, counts, filterNotes, onEdit }: LayerManagerProps) {
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
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        {loading ? (
          <div role="status" className="space-y-2">
            <p className="text-sm text-muted-foreground">Buscando as camadas…</p>
            {[0, 1, 2, 3].map((i) => <div key={i} className="bg-shimmer h-10 rounded-md" aria-hidden />)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ainda não há camadas para esta região.</p>
        )}
      </div>
    )
  }

  const isOn = (slug: string) => activeLayers.includes(slug)

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <section key={section.name} aria-labelledby={`layers-${i}`} className="rounded-lg border border-border bg-card p-2">
          <h4 id={`layers-${i}`} className="px-2.5 pb-1 pt-2 text-sm font-semibold">
            {section.name}
          </h4>
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
                  onEdit={onEdit && option.editable !== false ? () => onEdit(option.slug) : undefined}
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
                  onEdit={onEdit && option.editable !== false ? () => onEdit(option.slug) : undefined}
                  expander={
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-label={`${open ? 'Esconder' : 'Mostrar'} os grupos de ${option.label}`}
                      onClick={() => toggleExpanded(option.id)}
                      className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    >
                      {/* o mesmo chevron gira: a pessoa vê o que mudou, em vez de um ícone trocar por outro (8.1) */}
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-[320ms] ease-out', open && 'rotate-180')} aria-hidden />
                      <span className="sr-only">{onCount} de {slugs.length} ligados</span>
                    </button>
                  }
                />
                <Collapse open={open}>
                  {subs.map((sub) => <LayerRow key={sub.id} sub option={sub} checked={isOn(sub.slug)} onChange={(c) => onLayerToggle(sub.slug, c)} />)}
                </Collapse>
              </div>
            )
          })}
        </section>
      ))}

      {activeLayers.length > 0 && (
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onHideAll}>
          Ocultar todas
        </Button>
      )}
    </div>
  )
}
