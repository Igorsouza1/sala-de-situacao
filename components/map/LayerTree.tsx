'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Droplets, FolderInput, FolderPlus, Palette, Pencil, Power, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapse } from '@/components/ui/collapse'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { applyDrop, resolveDrop, visibleRows, type Dragging, type DropResult, type DropRow } from './helpers/layer-drop'
import {
  flattenLayout,
  folderOpacityOf,
  layerStyleOf,
  setFolderOpacity,
  setFolderOpen,
  setLayerStyle,
  stepFolder,
  stepLayer,
  type LayoutFolder,
  type MapLayout,
} from './helpers/layer-layout'
import { isLayerOn, type FilterNote } from './helpers/layers'
import { matchLayers } from './helpers/layer-search'
import { useFinePointer } from './helpers/use-fine-pointer'
import { LayerEntry, type LayerManagerOption, type LayerStatus } from './LayerManager'
import { LayerStyleCard } from './LayerStyleCard'

// A lista de camadas com pastas (DESIGN.md 13.1): uma pilha única, de cima para baixo. O que está em cima na lista está em cima no mapa.
// Cada pasta é um cartão com título; as camadas soltas seguidas formam um cartão sem título. Arrasta-se direto, sem modo:
// mouse (depois de mover uns pixels), toque (segurando meio segundo, para não brigar com a rolagem) e teclado (Alt + setas).

const MOUSE_SLOP = 5
const TOUCH_SLOP = 8
const TOUCH_HOLD = 500
const EDGE = 48
const MAX_SCROLL_STEP = 12

export interface LayerTreeProps {
  options: LayerManagerOption[]
  layout: MapLayout
  activeLayers: string[]
  onLayerToggle: (slug: string, isChecked: boolean) => void
  onGroupToggle?: (slugs: string[], isChecked: boolean) => void
  /** liga ou desliga tudo o que há na pasta (quem tem o mapa aplica, porque "ligada" depende da camada) */
  onFolderToggle: (folderId: string) => void
  onHideAll: () => void
  /** muda a organização a partir da de agora */
  onLayoutChange: (change: (layout: MapLayout) => MapLayout) => void
  status?: Record<string, LayerStatus>
  onRetry?: (slug: string) => void
  counts?: Record<string, number>
  filterNotes?: Record<string, FilterNote>
  flashSlug?: string | null
  expanded: string[]
  onToggleExpanded: (id: string) => void
  /** o que a pessoa faz com as pastas (menu do botão direito); criar, renomear e apagar só no computador */
  actions: {
    /** a pasta cuja nome está sendo escrito agora (acabou de ser criada, ou "Renomear") */
    renamingId: string | null
    onRenamingDone: () => void
    /** "Renomear" no menu: abre o nome da pasta para escrever */
    onStartRename: (id: string) => void
    onNewFolder: (slugs?: string[]) => void
    onRename: (id: string, name: string) => void
    onDelete: (id: string) => void
    onMoveTo: (slug: string, folderId: string | null) => void
  }
}

// Antes de haver um alvo o cartão está fechado; o Radix só precisa de algo que saiba dizer onde está
const NO_ANCHOR = { getBoundingClientRect: () => ({ x: 0, y: 0, top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) }) as DOMRect }

type Active = {
  dragging: Dragging
  key: string
  rows: DropRow[]
  /** o ponteiro, na tela */
  x: number
  y: number
  /** o ponto de partida e o topo da lista, em coordenadas do conteúdo (sobrevivem à rolagem) */
  startY: number
  listTop: number
  scroll: number
  result: DropResult | null
}

type Pending = { dragging: Dragging; key: string; x: number; y: number; touch: boolean; timer: ReturnType<typeof setTimeout> | null }

export function LayerTree({ options, layout, activeLayers, onLayerToggle, onGroupToggle, onFolderToggle, onHideAll, onLayoutChange, status, onRetry, counts, filterNotes, flashSlug, expanded, onToggleExpanded, actions }: LayerTreeProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const bySlug = useMemo(() => new Map(options.map((o) => [o.slug, o])), [options])
  const [drag, setDrag] = useState<Active | null>(null)
  const [landed, setLanded] = useState<string | null>(null)
  // quem usa leitor de tela não vê a linha andar: a frase diz onde a camada foi parar
  const [said, setSaid] = useState('')
  const fine = useFinePointer()
  // O cartão de cor e transparência: abre ancorado na amostra da camada (ou no cabeçalho da pasta) e guarda o último alvo enquanto fecha,
  // para o cartão não pular de lugar na saída (8.4)
  type Styling = { kind: 'layer'; slug: string; anchor: HTMLElement } | { kind: 'folder'; id: string; anchor: HTMLElement }
  const [styling, setStyling] = useState<Styling | null>(null)
  const lastStyling = useRef<Styling | null>(null)
  if (styling) lastStyling.current = styling
  const openedAt = useRef(0)
  const openStyle = useCallback((next: Styling) => { openedAt.current = Date.now(); setStyling(next) }, [])
  // A busca mostra só o que casa, com as pastas abertas. Enquanto busca, a lista é uma parte da pilha: ninguém arrasta nem move por teclado.
  const [query, setQuery] = useState('')
  const matches = useMemo(() => matchLayers(options, query), [options, query])
  const searching = matches !== null
  useEffect(() => { setSaid(matches ? `${matches.size} ${matches.size === 1 ? 'camada encontrada' : 'camadas encontradas'}` : '') }, [matches])

  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const active = useRef<Active | null>(null)
  const pending = useRef<Pending | null>(null)
  const raf = useRef<number | null>(null)
  const landedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const orderable = useCallback((slug: string) => {
    const o = bySlug.get(slug)
    return !!o && o.orderable !== false && !o.pinnedOnTop
  }, [bySlug])

  const land = useCallback((key: string) => {
    setLanded(key)
    if (landedTimer.current) clearTimeout(landedTimer.current)
    landedTimer.current = setTimeout(() => setLanded(null), 2000)
  }, [])

  const describe = useCallback((l: MapLayout, key: string): string => {
    if (key.startsWith('folder:')) {
      const id = key.slice(7)
      const at = l.items.findIndex((i) => i.kind === 'folder' && i.id === id)
      const folder = l.items[at]
      return folder && folder.kind === 'folder' ? `Pasta ${folder.name}: posição ${at + 1} de ${l.items.length}` : ''
    }
    const slug = key.slice(6)
    const label = bySlug.get(slug)?.label ?? slug
    const folder = l.items.find((i): i is LayoutFolder => i.kind === 'folder' && i.layers.some((x) => x.slug === slug))
    const flat = flattenLayout(l)
    const place = `posição ${flat.indexOf(slug) + 1} de ${flat.length}`
    return folder ? `${label}: na pasta ${folder.name}, ${place}` : `${label}: ${place}`
  }, [bySlug])

  // ── Arrasto ──────────────────────────────────────────────────────────────────────────────────────────────────────

  const scroller = () => listRef.current?.closest<HTMLElement>('[data-panel-scroll]') ?? null

  /** As linhas da tela, medidas uma vez ao começar: durante o arrasto nada muda de lugar, só a rolagem. */
  const measure = (scroll0: number): DropRow[] => {
    const list = listRef.current
    if (!list) return []
    return visibleRows(layoutRef.current).flatMap((row) => {
      const el = list.querySelector<HTMLElement>(`[data-row="${CSS.escape(row.key)}"]`)
      const r = el?.getBoundingClientRect()
      if (!r || r.height === 0) return []
      return [{ ...row, top: r.top + scroll0, bottom: r.bottom + scroll0, left: r.left }]
    })
  }

  const recompute = (x: number, y: number) => {
    const d = active.current
    if (!d) return
    const scroll = scroller()?.scrollTop ?? 0
    const result = resolveDrop(d.rows, d.dragging, { x, y: y + scroll })
    active.current = { ...d, x, y, scroll, result }
    setDrag(active.current)
  }

  const stop = useCallback(() => {
    if (pending.current?.timer) clearTimeout(pending.current.timer)
    pending.current = null
    active.current = null
    if (raf.current !== null) cancelAnimationFrame(raf.current)
    raf.current = null
    document.body.style.userSelect = ''
    setDrag(null)
  }, [])

  const tick = useCallback(() => {
    const d = active.current
    const el = scroller()
    if (!d || !el) return
    const box = el.getBoundingClientRect()
    let step = 0
    if (d.y < box.top + EDGE) step = -Math.ceil(((box.top + EDGE - d.y) / EDGE) * MAX_SCROLL_STEP)
    else if (d.y > box.bottom - EDGE) step = Math.ceil(((d.y - (box.bottom - EDGE)) / EDGE) * MAX_SCROLL_STEP)
    if (step !== 0) {
      const before = el.scrollTop
      el.scrollTop = before + step
      if (el.scrollTop !== before) recompute(d.x, d.y)
    }
    raf.current = requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activate = useCallback(() => {
    const p = pending.current
    const list = listRef.current
    if (!p || !list) return
    if (p.timer) clearTimeout(p.timer)
    const scroll0 = scroller()?.scrollTop ?? 0
    const rows = measure(scroll0)
    const next: Active = {
      dragging: p.dragging,
      key: p.key,
      rows,
      x: p.x,
      y: p.y,
      startY: p.y + scroll0,
      listTop: list.getBoundingClientRect().top + scroll0,
      scroll: scroll0,
      result: null,
    }
    pending.current = null
    active.current = next
    setDrag(next)
    document.body.style.userSelect = 'none'
    navigator.vibrate?.(8)
    const label = p.dragging.type === 'layer' ? (bySlug.get(p.dragging.slug)?.label ?? '') : 'a pasta'
    setSaid(`Arrastando ${label}. Solte onde quer colocar.`)
    raf.current = requestAnimationFrame(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bySlug, tick])

  const finish = useCallback((cancel: boolean) => {
    const d = active.current
    stop()
    if (!d) return
    // o clique que vem logo depois de soltar não pode ligar ou desligar a camada que estava sob o ponteiro
    const eat = (e: Event) => { e.stopPropagation(); e.preventDefault() }
    window.addEventListener('click', eat, { capture: true, once: true })
    setTimeout(() => window.removeEventListener('click', eat, { capture: true }), 0)
    if (cancel || !d.result || d.result.noop) { setSaid('Nada mudou de lugar.'); return }
    const { target } = d.result
    onLayoutChange((l) => {
      const moved = applyDrop(l, target)
      // solta numa pasta fechada: ela abre, para a pessoa ver onde a camada foi parar (8.4)
      return target.kind === 'layer' && target.to.folderId ? setFolderOpen(moved, target.to.folderId, true) : moved
    })
    const key = target.kind === 'layer' ? `layer:${target.slug}` : `folder:${target.id}`
    land(key)
    setSaid(describe(applyDrop(layoutRef.current, target), key))
  }, [stop, onLayoutChange, land, describe])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const p = pending.current
      if (p) {
        const far = Math.hypot(e.clientX - p.x, e.clientY - p.y)
        if (p.touch) { if (far > TOUCH_SLOP) stop() } // o dedo andou antes de segurar: é rolagem
        else if (far >= MOUSE_SLOP) { p.x = e.clientX; p.y = e.clientY; activate() }
        return
      }
      if (active.current) recompute(e.clientX, e.clientY)
    }
    const onUp = () => { if (active.current) finish(false); else stop() }
    const onCancel = () => { if (active.current) finish(true); else stop() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && active.current) { e.preventDefault(); finish(true) } }
    // com o dedo segurando, a página não pode rolar nem abrir o menu do sistema
    const onTouchMove = (e: TouchEvent) => { if (active.current && e.cancelable) e.preventDefault() }
    const onMenu = (e: Event) => { if (pending.current?.touch || active.current) e.preventDefault() }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('contextmenu', onMenu)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('contextmenu', onMenu)
      stop()
      if (landedTimer.current) clearTimeout(landedTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const begin = (e: React.PointerEvent, dragging: Dragging, key: string) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (searching || (e.target as HTMLElement).closest('[role="switch"], [data-nodrag]')) return
    const touch = e.pointerType === 'touch'
    const timer = touch ? setTimeout(activate, TOUCH_HOLD) : null
    pending.current = { dragging, key, x: e.clientX, y: e.clientY, touch, timer }
  }

  // ── Teclado: Alt + setas move a camada (ou a pasta) um passo; o foco acompanha ──────────────────────────────────────

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (searching || !e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-row]')
    const key = row?.dataset.row
    if (!key) return
    const delta = e.key === 'ArrowUp' ? -1 : 1
    if (key.startsWith('layer:') && !orderable(key.slice(6))) return
    e.preventDefault()
    const next = key.startsWith('folder:') ? stepFolder(layoutRef.current, key.slice(7), delta) : stepLayer(layoutRef.current, key.slice(6), delta)
    if (next === layoutRef.current) { setSaid('Já está na ponta.'); return }
    onLayoutChange((l) => (key.startsWith('folder:') ? stepFolder(l, key.slice(7), delta) : stepLayer(l, key.slice(6), delta)))
    land(key)
    setSaid(describe(next, key))
    // a linha pode trocar de pasta e ser remontada: o foco volta a ela
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-row="${CSS.escape(key)}"] [role="switch"]`)?.focus())
  }

  // ── Desenho ──────────────────────────────────────────────────────────────────────────────────────────────────────

  const offsetOf = (key: string): number | null => {
    if (!drag || drag.key !== key) return null
    return drag.y + drag.scroll - drag.startY
  }
  const lineTop = drag?.result?.line ? drag.result.line.y - drag.listTop : null
  const folders = layout.items.filter((i): i is LayoutFolder => i.kind === 'folder')
  const folderOf = (slug: string) => folders.find((f) => f.layers.some((l) => l.slug === slug))

  // Abrir um cartão a partir de um item de menu: o menu devolve o foco ao que o abriu ao fechar, e o cartão, nascendo no mesmo instante, se
  // fecharia por esse foco "de fora". Então ele espera o menu terminar.
  const openFromMenu = (open: () => void) => { setTimeout(open, 80) }

  const cardTarget = styling ?? lastStyling.current
  const card = (() => {
    if (!cardTarget) return null
    if (cardTarget.kind === 'folder') {
      const folder = folders.find((f) => f.id === cardTarget.id)
      if (!folder) return null
      const opacity = folderOpacityOf(layout, folder.id) ?? 1
      return (
        <LayerStyleCard
          kind="folder"
          title={folder.name}
          count={folder.layers.length}
          opacity={opacity}
          onOpacity={(v) => onLayoutChange((l) => setFolderOpacity(l, folder.id, v >= 1 ? null : v))}
          changed={folder.opacity !== undefined}
          onReset={() => onLayoutChange((l) => setFolderOpacity(l, folder.id, null))}
        />
      )
    }
    const option = bySlug.get(cardTarget.slug)
    const caps = option?.personal
    if (!option || !caps) return null
    const own = layerStyleOf(layout, option.slug)
    return (
      <LayerStyleCard
        kind="layer"
        title={option.label}
        option={option}
        opacity={own.opacity ?? 1}
        onOpacity={(v) => onLayoutChange((l) => setLayerStyle(l, option.slug, { opacity: v >= 1 ? null : v }))}
        color={caps.color ? { value: caps.mainColor, onChange: (hex) => onLayoutChange((l) => setLayerStyle(l, option.slug, { color: hex })) } : undefined}
        colorLockedReason={caps.color ? undefined : 'A cor desta camada mostra a situação de cada registro, por isso só a transparência muda.'}
        changed={own.color !== undefined || own.opacity !== undefined}
        onReset={() => onLayoutChange((l) => setLayerStyle(l, option.slug, { color: null, opacity: null }))}
      />
    )
  })()

  const entry = (option: LayerManagerOption) => {
    const canDrag = !searching && orderable(option.slug)
    const node = (
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
        flashSlug={landed === `layer:${option.slug}` ? option.slug : flashSlug}
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        draggable={canDrag}
        onRowPointerDown={canDrag ? (e) => begin(e, { type: 'layer', slug: option.slug }, `layer:${option.slug}`) : undefined}
        onOpenStyle={(slug, anchor) => openStyle({ kind: 'layer', slug, anchor })}
        dragOffset={offsetOf(`layer:${option.slug}`)}
      />
    )
    // o botão direito só existe no mouse; no toque o segurar já é o arrasto
    if (!fine) return node
    const here = folderOf(option.slug)
    const targets = folders.filter((f) => f.id !== here?.id)
    return (
      <ContextMenu key={option.id}>
        <ContextMenuTrigger asChild><div>{node}</div></ContextMenuTrigger>
        <ContextMenuContent>
          {option.personal && (
            <ContextMenuItem onSelect={() => openFromMenu(() => {
              const swatch = listRef.current?.querySelector<HTMLElement>(`[data-row="layer:${option.slug}"] button[data-nodrag][title="Cor e transparência"]`)
              const row = listRef.current?.querySelector<HTMLElement>(`[data-row="layer:${option.slug}"]`)
              const anchor = swatch ?? row
              if (anchor) openStyle({ kind: 'layer', slug: option.slug, anchor })
            })}>
              <Palette aria-hidden />
              Cor e transparência
            </ContextMenuItem>
          )}
          <ContextMenuItem onSelect={() => actions.onNewFolder([option.slug])}>
            <FolderPlus aria-hidden />
            Criar pasta com esta camada
          </ContextMenuItem>
          {(targets.length > 0 || here) && (
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <FolderInput aria-hidden />
                Mover para a pasta
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {targets.map((f) => (
                  <ContextMenuItem key={f.id} onSelect={() => actions.onMoveTo(option.slug, f.id)}>{f.name}</ContextMenuItem>
                ))}
                {here && (
                  <>
                    {targets.length > 0 && <ContextMenuSeparator />}
                    <ContextMenuItem onSelect={() => actions.onMoveTo(option.slug, null)}>Fora das pastas</ContextMenuItem>
                  </>
                )}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  // os blocos da pilha, na ordem: cada pasta é um cartão; as camadas soltas seguidas formam um cartão só.
  // Buscando, ficam só as camadas que casam (e as pastas que as têm).
  const shown = (o: LayerManagerOption) => !matches || matches.has(o.slug)
  const blocks: ({ kind: 'loose'; options: LayerManagerOption[] } | { kind: 'folder'; folder: LayoutFolder })[] = []
  for (const item of layout.items) {
    if (item.kind === 'folder') {
      const any = item.layers.some((l) => { const o = bySlug.get(l.slug); return !!o && shown(o) })
      if (!searching || any) blocks.push({ kind: 'folder', folder: item })
      continue
    }
    const option = bySlug.get(item.slug)
    if (!option || !shown(option)) continue
    const last = blocks[blocks.length - 1]
    if (last?.kind === 'loose') last.options.push(option)
    else blocks.push({ kind: 'loose', options: [option] })
  }

  const cardClass = 'select-none rounded-lg border border-border bg-card p-2 transition-shadow duration-200'
  // com poucas camadas a busca é só mais um controle sem motivo (2.2); passa de cinco, ela vale
  const showSearch = options.length > 5 || searching

  return (
    <div ref={listRef} onKeyDown={onKeyDown} className="relative space-y-4">
      {showSearch && (
        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
            aria-label="Buscar camada pelo nome"
            placeholder="Buscar camada"
            className="pl-9 pr-10"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </form>
      )}

      {searching && blocks.length === 0 && (
        <section className={cn(cardClass, 'p-4')}>
          <p className="text-sm font-medium">Nenhuma camada com “{query.trim()}”</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">Tente outra palavra, ou limpe a busca para ver todas.</p>
          <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setQuery('')}>
            Limpar a busca
          </Button>
        </section>
      )}

      {blocks.map((block, i) => {
        if (block.kind === 'loose') {
          return (
            <section key={`loose-${block.options[0].slug}`} aria-label="Camadas fora de pastas" className={cardClass}>
              {block.options.map(entry)}
            </section>
          )
        }
        const { folder } = block
        const key = `folder:${folder.id}`
        const members = folder.layers.map((l) => bySlug.get(l.slug)).filter((o): o is LayerManagerOption => !!o)
        const visible = members.filter(shown)
        const onCount = members.filter((o) => isLayerOn(o.slug, activeLayers)).length
        const dy = offsetOf(key)
        const receiving = drag?.result?.folderId === folder.id
        const renaming = actions.renamingId === folder.id
        const header = (
          <div
            data-row={key}
            onPointerDown={searching ? undefined : (e) => begin(e, { type: 'folder', id: folder.id }, key)}
            className="group/row relative flex min-h-12 items-center gap-3 rounded-md pl-2.5 pr-3 transition-colors duration-200 hover:bg-muted"
          >
            {renaming ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 py-1">
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground', !folder.open && '-rotate-90')} aria-hidden />
                <RenameField
                  initial={folder.name}
                  onCommit={(name) => { actions.onRename(folder.id, name); actions.onRenamingDone() }}
                  onCancel={actions.onRenamingDone}
                />
              </div>
            ) : (
              <button
                type="button"
                aria-expanded={folder.open || searching}
                onClick={() => onLayoutChange((l) => setFolderOpen(l, folder.id, !folder.open))}
                className="flex min-w-0 flex-1 items-center gap-2 self-stretch rounded-md py-2 text-left focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
              >
                {/* o mesmo chevron gira: aberta aponta para baixo, fechada para a direita (8.1) */}
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-[320ms] ease-out', !(folder.open || searching) && '-rotate-90')} aria-hidden />
                <span className="min-w-0">
                  <span id={`folder-${i}`} className="block truncate text-sm font-semibold">{folder.name}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {members.length === 0 ? 'Sem camadas' : `${onCount} de ${members.length} ${members.length === 1 ? 'ligada' : 'ligadas'}`}
                  </span>
                </span>
              </button>
            )}
            <Switch
              checked={onCount > 0}
              onCheckedChange={() => onFolderToggle(folder.id)}
              disabled={members.length === 0}
              aria-label={`Ligar ou desligar tudo em ${folder.name}`}
            />
          </div>
        )
        return (
          <section
            key={folder.id}
            aria-labelledby={`folder-${i}`}
            style={dy !== null ? { translate: `0 ${dy}px`, scale: '1.01' } : undefined}
            className={cn(cardClass, landed === key && 'animate-found', receiving && 'ring-2 ring-primary/40', dy !== null && 'pointer-events-none relative z-20 shadow-control')}
          >
            {fine ? (
              <ContextMenu>
                <ContextMenuTrigger asChild>{header}</ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => actions.onStartRename(folder.id)}>
                    <Pencil aria-hidden />
                    Renomear
                  </ContextMenuItem>
                  <ContextMenuItem disabled={members.length === 0} onSelect={() => onFolderToggle(folder.id)}>
                    <Power aria-hidden />
                    {onCount > 0 ? 'Desligar tudo' : 'Ligar tudo'}
                  </ContextMenuItem>
                  <ContextMenuItem disabled={members.length === 0} onSelect={() => openFromMenu(() => {
                    const anchor = listRef.current?.querySelector<HTMLElement>(`[data-row="${key}"]`)
                    if (anchor) openStyle({ kind: 'folder', id: folder.id, anchor })
                  })}>
                    <Droplets aria-hidden />
                    Transparência da pasta
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => actions.onNewFolder()}>
                    <FolderPlus aria-hidden />
                    Nova pasta
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem danger onSelect={() => actions.onDelete(folder.id)}>
                    <Trash2 aria-hidden />
                    Apagar pasta
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ) : (
              header
            )}
            <Collapse open={folder.open || searching}>
              {visible.map(entry)}
              {members.length === 0 && (
                <div data-row={`empty:${folder.id}`} className="flex min-h-12 items-center px-2.5 text-xs text-muted-foreground">
                  Pasta vazia. Arraste uma camada para cá.
                </div>
              )}
            </Collapse>
          </section>
        )
      })}

      {/* onde a camada vai cair: recuada quando cai dentro de uma pasta, de ponta a ponta quando cai na pilha */}
      <div
        aria-hidden
        style={{ top: lineTop !== null ? lineTop - 1 : 0 }}
        className={cn(
          'pointer-events-none absolute z-30 h-0.5 rounded-full bg-primary transition-[top,left,opacity] duration-150 ease-out',
          lineTop !== null ? 'opacity-100' : 'opacity-0',
          drag?.result?.line?.inset ? 'left-8 right-3' : 'left-3 right-3',
        )}
      />

      <Popover open={!!styling && !!card} onOpenChange={(open) => { if (!open) setStyling(null) }}>
        <PopoverAnchor virtualRef={{ current: cardTarget?.anchor ?? NO_ANCHOR }} />
        <PopoverContent
          align="start"
          sideOffset={10}
          className="popover-spring z-[1200] w-72 rounded-lg p-4 shadow-control"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          // o toque que abriu o cartão (ou o foco que volta de um menu) não pode fechá-lo no mesmo instante
          onInteractOutside={(e) => { if (Date.now() - openedAt.current < 250) e.preventDefault() }}
        >
          {card}
        </PopoverContent>
      </Popover>

      <p className="sr-only" role="status" aria-live="polite">{said}</p>

      {activeLayers.length > 0 && (
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onHideAll}>
          Ocultar todas
        </Button>
      )}
    </div>
  )
}

// O nome da pasta, escrito na própria linha (sem janela): Enter ou sair do campo guarda; Esc deixa como estava (6.2 regra 6: campo do projeto).
function RenameField({ initial, onCommit, onCancel }: { initial: string; onCommit: (name: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const done = useRef(false)
  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
    ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [])
  const finish = (save: boolean) => {
    if (done.current) return
    done.current = true
    if (save) onCommit(ref.current?.value ?? initial)
    else onCancel()
  }
  return (
    <Input
      ref={ref}
      data-nodrag
      defaultValue={initial}
      maxLength={60}
      aria-label="Nome da pasta"
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(true) }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(false) }
      }}
      onBlur={() => finish(true)}
      className="h-8 px-2 text-sm font-semibold"
    />
  )
}
