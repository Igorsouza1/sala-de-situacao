"use client"

import { useId, useMemo, useRef, useState, type ReactNode } from "react"
import { ChevronDown, ChevronRight, GripVertical, Layers } from "lucide-react"
import { resolveLayerIcon } from "./helpers/layer-icons"
import { Button } from "@/components/ui/button"
import { Collapse } from "@/components/ui/collapse"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { filterLine, type FilterNote } from "./helpers/layers"
import type { MapLayout } from "./helpers/layer-layout"

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
  /** false: o mapa não a empilha (a Fauna); fica nas pastas, mas não se arrasta para outra posição */
  orderable?: boolean
  /** o mapa a desenha sempre por cima (os ícones das Ações): a linha diz isso e não tem alça */
  pinnedOnTop?: boolean
  /** o que a pessoa pode ajustar só para si (cor e transparência) e a cor que ela vê agora; ausente: nada a ajustar (a Fauna, o mapa de calor) */
  personal?: { color: boolean; opacity: boolean; mainColor: string }
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
  /** modo "escolher a camada para editar" (13.3): cada linha vira um botão que abre o editor. Sem lápis em cada linha. */
  onPick?: (slug: string) => void
  /** camada com áreas (ex.: Ações): o que se edita é o ícone de cada área, não a camada */
  onPickGroup?: (layerSlug: string, groupKey: string) => void
  /** quais camadas com áreas estão abertas: quem usa o LayerManager em dois lugares (lista e editar) guarda isto, para a lista não fechar ao voltar */
  expanded?: string[]
  onToggleExpanded?: (id: string) => void
  /** a camada acabou de ser editada: a linha pisca em verde claro (8.4) */
  flashSlug?: string | null
  /** a organização da pessoa (pastas e ordem): o modo "escolher o que editar" mostra as mesmas pastas da lista; sem ela, agrupa por categoria */
  layout?: MapLayout
}

// o ícone da camada é o do mapa (Tabler, 11); sem ícone, o das camadas
const getLayerIcon = (iconName?: string): React.ElementType => (iconName ? resolveLayerIcon(iconName) : Layers)

const CATEGORY_ORDER = ['Operacional', 'Monitoramento', 'Base Territorial', 'Infraestrutura']

// Amostra fiel ao mapa: preenchimento, contorno e transparência da camada. Um fio escuro por fora garante que ela apareça
// mesmo quando a cor da camada é clara (a linha das estradas é creme, o contorno das nascentes é branco): sem ele, a legenda
// some no cartão branco e a pessoa precisa adivinhar o que a cor significa. Desligada, a amostra fica esmaecida.
export function Legend({ option, checked }: { option: LayerManagerOption; checked: boolean }) {
  const Icon = getLayerIcon(option.icon)
  const type = option.legendType || 'polygon'
  const stroke = option.color
  const fill = option.fillColor || option.color
  const fillOpacity = option.fillOpacity ?? 1
  // O quadrado tem borda firme: o preenchimento (que pode ser translúcido) fica só DENTRO da borda (`padding-box`); antes ele corria por
  // baixo dos 2 px da borda e os dois se misturavam. O fio de fora (regra 5: cor clara no cartão branco nunca some) é um contorno
  // OPACO de 1 px na cor pedra, não mais um anel de 25% de transparência, que completava o esfumaçado.
  const inside = 'padding-box'
  const fio = 'outline outline-1 outline-stone'
  return (
    <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center transition-opacity duration-200', !checked && 'opacity-40')} aria-hidden>
      {/* ícone: a mesma cara do marcador do mapa (cor cheia e ícone branco, 6.2 regra 5); antes era só o contorno e a pessoa não via a cor */}
      {type === 'icon' && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full ring-1 ring-foreground/25" style={{ backgroundColor: stroke }}>
          <Icon size={14} color="white" />
        </span>
      )}
      {type === 'point' && (
        <span className="flex h-6 w-6 items-center justify-center rounded-md border bg-card" style={{ borderColor: stroke }}>
          <Icon size={14} style={{ color: stroke }} />
        </span>
      )}
      {type === 'line' && (
        <svg width="24" height="24" viewBox="0 0 20 20" className="overflow-visible">
          <path d="M2 15 C 8 15, 12 5, 18 5" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" className="text-foreground/25" />
          <path d="M2 15 C 8 15, 12 5, 18 5" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
      {type === 'circle' && <span className={cn('h-4 w-4 rounded-full border-2', fio)} style={{ backgroundColor: fill, backgroundClip: inside, borderColor: stroke }} />}
      {type === 'polygon' && (
        <span
          className={cn('h-4 w-4 rounded-[3px] border-2', fio)}
          style={{ backgroundColor: `color-mix(in srgb, ${fill} ${Math.round(fillOpacity * 100)}%, transparent)`, backgroundClip: inside, borderColor: stroke }}
        />
      )}
      {type === 'heatmap' && <span className="h-4 w-4 rounded-sm border border-foreground/30" style={{ background: `linear-gradient(135deg, ${option.color || 'red'} 0%, transparent 100%)`, backgroundClip: inside }} />}
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
  flashed?: boolean
  /** a linha se arrasta (a lista com pastas): mostra a alça ao passar o mouse */
  draggable?: boolean
  /** a chave desta linha para quem mede a posição durante o arrasto (`layer:<slug>`) */
  rowKey?: string
  onRowPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  /** a amostra abre o cartão de cor e transparência (só para quem pode ajustar) */
  onOpenStyle?: (anchor: HTMLElement) => void
  /** está sendo arrastada: sobe, ganha sombra e acompanha o ponteiro */
  dragOffset?: number | null
}

// Colunas alinhadas (DESIGN.md 6.2, regra 8): o interruptor é SEMPRE a última coluna, no mesmo lugar em toda linha, tenha ela grupos ou não.
// O que expande (a seta) vai junto do nome, que é de onde a pessoa lê "isto abre"; as linhas-filhas recuam só o nome e a amostra,
// nunca o interruptor. A linha toda liga e desliga (um <label> amarrado ao interruptor), com alvo de 48 px para o toque.
// A saída do erro é um botão e fica fora do <label>, senão o clique nela ligaria ou desligaria a camada.
export function LayerRow({ option, checked, onChange, count, status, note, onRetry, expander, sub, flashed, draggable, rowKey, onRowPointerDown, onOpenStyle, dragOffset }: RowProps) {
  const id = useId()
  const showCount = !sub && checked && status !== 'loading' && status !== 'error' && count !== undefined
  const showNote = checked && !!note && status !== 'error'
  // a frase fica guardada: ao sumir, a altura encolhe com o texto ainda lá, em vez de o texto sumir e a linha pular
  const lastNote = useRef('')
  if (showNote) lastNote.current = filterLine(note!, count)
  const dragging = dragOffset !== undefined && dragOffset !== null
  return (
    <div
      data-row={rowKey}
      onPointerDown={onRowPointerDown}
      style={dragging ? { translate: `0 ${dragOffset}px`, scale: '1.02' } : undefined}
      className={cn(
        'group/row relative',
        flashed && 'animate-found rounded-md',
        sub && 'before:absolute before:bottom-0 before:left-[1.65rem] before:top-0 before:w-px before:bg-border',
        dragging && 'pointer-events-none z-20 rounded-md bg-card shadow-control',
      )}
    >
      {/* a alça mora no respiro do cartão: aparece ao passar o mouse e não toma o lugar de nenhuma coluna (6.2, regra 8) */}
      {draggable && (
        <GripVertical aria-hidden className="pointer-events-none absolute -left-1.5 top-1/2 h-4 w-3 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover/row:opacity-100" />
      )}
      <div className="flex min-h-12 items-center gap-3 rounded-md pl-2.5 pr-3 transition-colors duration-200 hover:bg-muted">
        {/* A amostra é a porta do cartão de cor e transparência. Fica FORA do rótulo (clicar nela não liga a camada) e no mesmo lugar de sempre:
            o botão tem 44 px (alvo de toque) e a margem negativa devolve a amostra aos mesmos 10 px da borda (6.2, regra 8). */}
        {onOpenStyle && !sub && (
          <button
            type="button"
            data-nodrag
            title="Cor e transparência"
            aria-label={`Cor e transparência de ${option.label}`}
            onClick={(e) => onOpenStyle(e.currentTarget)}
            className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-md transition-[background-color,scale] duration-200 ease-spring hover:bg-secondary active:scale-[0.94] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <Legend option={option} checked={checked} />
          </button>
        )}
        <label htmlFor={id} className={cn('flex min-w-0 flex-1 cursor-pointer items-center gap-3 self-stretch py-2', sub && 'pl-6')}>
          {!(onOpenStyle && !sub) && <Legend option={option} checked={checked} />}
          <span className="min-w-0">
            <span className={cn('block truncate text-sm', !checked && 'text-muted-foreground')}>{option.label}</span>
            {option.pinnedOnTop && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">Sempre por cima no mapa</span>}
            <Collapse open={showNote}>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{lastNote.current}</span>
            </Collapse>
          </span>
          {expander}
          <span className="flex-1" aria-hidden />
          {checked && status === 'loading' && (
            <span role="status" className="flex shrink-0 items-center">
              <span className="bg-shimmer h-2 w-10 rounded-sm" aria-hidden />
              <span className="sr-only">Carregando</span>
            </span>
          )}
          {showCount && <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{count}</span>}
        </label>
        <Switch id={id} checked={checked} onCheckedChange={onChange} aria-label={option.label} />
      </div>
      {checked && status === 'error' && (
        <p className="pb-2 pl-12 pr-3 text-xs text-crit">
          Não carregou.{' '}
          <button type="button" data-nodrag onClick={() => onRetry?.(option.slug)} className="underline underline-offset-2 hover:text-crit/80">
            Tentar de novo
          </button>
        </p>
      )}
    </div>
  )
}

export interface LayerEntryProps {
  option: LayerManagerOption
  activeLayers: string[]
  onLayerToggle: (slug: string, isChecked: boolean) => void
  onGroupToggle?: (slugs: string[], isChecked: boolean) => void
  status?: Record<string, LayerStatus>
  onRetry?: (slug: string) => void
  counts?: Record<string, number>
  filterNotes?: Record<string, FilterNote>
  flashSlug?: string | null
  /** quais camadas com grupos estão abertas */
  expanded: string[]
  onToggleExpanded: (id: string) => void
  draggable?: boolean
  onRowPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
  /** abre o cartão de cor e transparência desta camada, ancorado na amostra */
  onOpenStyle?: (slug: string, anchor: HTMLElement) => void
  dragOffset?: number | null
}

// Uma camada na lista: a linha comum, ou, se tem grupos (Ações por eixo, a Fauna), a linha com o interruptor que liga todos e o chevron que
// abre os grupos, um nível só.
export function LayerEntry({ option, activeLayers, onLayerToggle, onGroupToggle, status, onRetry, counts, filterNotes, flashSlug, expanded, onToggleExpanded, draggable, onRowPointerDown, onOpenStyle, dragOffset }: LayerEntryProps) {
  const isOn = (slug: string) => activeLayers.includes(slug)
  const subs = option.subOptions
  const drag = {
    draggable,
    rowKey: `layer:${option.slug}`,
    onRowPointerDown,
    dragOffset,
    onOpenStyle: option.personal && onOpenStyle ? (anchor: HTMLElement) => onOpenStyle(option.slug, anchor) : undefined,
  }
  if (!subs?.length) {
    return (
      <LayerRow
        option={option}
        checked={isOn(option.slug)}
        onChange={(c) => onLayerToggle(option.slug, c)}
        count={counts?.[option.slug]}
        status={status?.[option.slug]}
        note={filterNotes?.[option.slug]}
        onRetry={onRetry}
        flashed={flashSlug === option.slug}
        {...drag}
      />
    )
  }
  // camada com grupos (ex.: Ações por eixo): o interruptor liga ou desliga todos; o chevron abre os grupos, um nível só
  const slugs = subs.map((s) => s.slug)
  const onCount = slugs.filter(isOn).length
  const open = expanded.includes(option.id)
  return (
    <div>
      <LayerRow
        option={option}
        checked={onCount > 0}
        onChange={(c) => onGroupToggle?.(slugs, c)}
        count={counts?.[option.slug]}
        status={status?.[option.slug]}
        note={filterNotes?.[option.slug]}
        onRetry={onRetry}
        flashed={flashSlug === option.slug}
        {...drag}
        expander={
          <button
            type="button"
            data-nodrag
            aria-expanded={open}
            aria-label={`${open ? 'Esconder' : 'Mostrar'} os grupos de ${option.label}`}
            onClick={() => onToggleExpanded(option.id)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
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
}

export function LayerManager({ options, activeLayers, onLayerToggle, onHideAll, onGroupToggle, status, onRetry, loading, counts, filterNotes, onPick, onPickGroup, flashSlug, expanded: expandedProp, onToggleExpanded, layout }: LayerManagerProps) {
  const [localExpanded, setLocalExpanded] = useState<string[]>([])
  const expanded = expandedProp ?? localExpanded
  const toggleExpanded = (id: string) =>
    onToggleExpanded ? onToggleExpanded(id) : setLocalExpanded((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))

  const sections = useMemo(() => {
    // com a organização da pessoa, cada pasta é um cartão e as camadas soltas seguidas formam um cartão sem título
    if (layout) {
      const bySlug = new Map(options.map((o) => [o.slug, o]))
      const out: { name: string; items: LayerManagerOption[]; loose?: boolean }[] = []
      for (const item of layout.items) {
        if (item.kind === 'folder') {
          out.push({ name: item.name, items: item.layers.map((l) => bySlug.get(l.slug)).filter((o): o is LayerManagerOption => !!o) })
          continue
        }
        const option = bySlug.get(item.slug)
        if (!option) continue
        const last = out[out.length - 1]
        if (last?.loose) last.items.push(option)
        else out.push({ name: '', items: [option], loose: true })
      }
      return out
    }
    const groups: Record<string, LayerManagerOption[]> = {}
    options.forEach((opt) => {
      const cat = opt.category || 'Outros'
      ;(groups[cat] ||= []).push(opt)
    })
    const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length)
    return Object.keys(groups)
      .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
      .map((name) => ({ name, items: groups[name], loose: false }))
  }, [options, layout])

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

  // Modo "escolher o que editar": uma lista limpa, em que cada linha é um botão com rótulo e seta. Sem interruptor, sem contagem e
  // sem lápis em cada linha (13.3). Camada com áreas (Ações) NÃO é editável como um todo: ela é só o interruptor que liga as áreas;
  // o que se edita é o ícone de cada área. Então a linha dela abre as áreas, e a frase embaixo do nome diz isso.
  if (onPick) {
    const rowClass = 'flex min-h-12 w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors duration-200 hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30'
    return (
      <div className="space-y-4">
        {sections.map((section, i) => {
          const items = section.items.filter((o) => o.editable !== false)
          if (items.length === 0) return null
          return (
            <section key={`${section.name}-${i}`} aria-labelledby={section.name ? `pick-${i}` : undefined} className="rounded-lg border border-border bg-card p-2">
              {section.name && <h4 id={`pick-${i}`} className="px-2.5 pb-1 pt-2 text-sm font-semibold">{section.name}</h4>}
              {items.map((option) => {
                const subs = option.subOptions
                if (subs?.length && onPickGroup) {
                  const open = expanded.includes(option.id)
                  return (
                    <div key={option.id}>
                      <button type="button" aria-expanded={open} onClick={() => toggleExpanded(option.id)} className={rowClass}>
                        <Legend option={option} checked />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">Edite o ícone de cada área</span>
                        </span>
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-[320ms] ease-out', open && 'rotate-180')} aria-hidden />
                      </button>
                      <Collapse open={open}>
                        <div className="relative before:absolute before:bottom-0 before:left-[1.65rem] before:top-0 before:w-px before:bg-border">
                          {subs.map((sub) => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => onPickGroup(option.slug, sub.slug.slice(option.slug.length + 2))}
                              className={cn(rowClass, 'pl-9', flashSlug === sub.slug && 'animate-found')}
                            >
                              <Legend option={sub} checked />
                              <span className="min-w-0 flex-1 truncate text-sm">{sub.label}</span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            </button>
                          ))}
                        </div>
                      </Collapse>
                    </div>
                  )
                }
                return (
                  <button key={option.id} type="button" onClick={() => onPick(option.slug)} className={cn(rowClass, flashSlug === option.slug && 'animate-found')}>
                    <Legend option={option} checked />
                    <span className="min-w-0 flex-1 truncate text-sm">{option.label}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                )
              })}
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <section key={`${section.name}-${i}`} aria-labelledby={`layers-${i}`} className="rounded-lg border border-border bg-card p-2">
          <h4 id={`layers-${i}`} className="px-2.5 pb-1 pt-2 text-sm font-semibold">
            {section.name}
          </h4>
          {section.items.map((option) => (
            <LayerEntry
              key={option.id}
              option={option}
              activeLayers={activeLayers}
              onLayerToggle={onLayerToggle}
              onGroupToggle={onGroupToggle}
              counts={counts}
              status={status}
              filterNotes={filterNotes}
              onRetry={onRetry}
              flashSlug={flashSlug}
              expanded={expanded}
              onToggleExpanded={toggleExpanded}
            />
          ))}
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
