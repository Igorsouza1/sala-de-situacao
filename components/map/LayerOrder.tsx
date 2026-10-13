'use client'

import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { ArrowLeft, ArrowUpDown, Check, ChevronDown, ChevronUp, GripVertical, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlItem } from './helpers/control-style'
import { isLayerOn } from './helpers/layers'
import { moveBy } from './helpers/legend-sheet'
import { Legend, type LayerManagerOption } from './LayerManager'
import { PanelCard } from './PanelCard'

// A ordem das camadas no mapa (DESIGN.md 13.1). Uma lista só, de cima para baixo: a de cima da lista é a de cima do mapa.
// Arrasta-se pela alça, ou usam-se as setas (com o teclado ou o dedo). Vale na hora, só para quem mexeu, e fica neste aparelho.

/** A entrada na lista de camadas: um botão com rótulo, que abre esta visão (8: o que abre diz que abre). */
export function LayerOrderEntry({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn('flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-2 text-left', controlItem())}
    >
      <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">Ordem das camadas</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">Escolha o que fica por cima no mapa</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 -rotate-90" aria-hidden />
    </button>
  )
}

interface RowProps {
  option: LayerManagerOption
  slugs: string[]
  index: number
  on: boolean
  onMove: (next: string[], option: LayerManagerOption) => void
}

// Colunas iguais em toda linha (6.2, regra 8): alça, amostra, nome, subir, descer. Quem está na ponta mantém o botão, só esmaecido.
function Row({ option, slugs, index, on, onMove }: RowProps) {
  const controls = useDragControls()
  const [dragging, setDragging] = useState(false)
  const first = index === 0
  const last = index === slugs.length - 1
  const move = (delta: -1 | 1) => onMove(moveBy(slugs, option.slug, delta), option)
  const arrow = (disabled: boolean) =>
    cn('flex size-8 shrink-0 items-center justify-center', disabled ? 'cursor-default opacity-30 hover:bg-transparent hover:text-muted-foreground' : '', controlItem())

  return (
    <Reorder.Item
      value={option.slug}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => setDragging(true)}
      onDragEnd={() => setDragging(false)}
      className={cn('relative list-none rounded-md transition-shadow duration-200', dragging && 'z-10 bg-card shadow-control')}
    >
      <div className="flex min-h-12 items-center gap-2 py-1 pr-1">
        <button
          type="button"
          title="Arraste para mudar a ordem"
          aria-label={`Mudar a ordem de ${option.label}. Arraste, ou use as setas para cima e para baixo.`}
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); move(e.key === 'ArrowUp' ? -1 : 1) }
          }}
          className={cn('flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing', controlItem())}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <Legend option={option} checked={on} />
        <span className={cn('min-w-0 flex-1 truncate text-sm', !on && 'text-muted-foreground')}>{option.label}</span>
        <button type="button" title="Subir" aria-label={`Subir ${option.label}`} aria-disabled={first} onClick={() => !first && move(-1)} className={arrow(first)}>
          <ChevronUp className="h-4 w-4" aria-hidden />
        </button>
        <button type="button" title="Descer" aria-label={`Descer ${option.label}`} aria-disabled={last} onClick={() => !last && move(1)} className={arrow(last)}>
          <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </Reorder.Item>
  )
}

export interface LayerOrderProps {
  /** de cima para baixo, como a lista é lida */
  items: LayerManagerOption[]
  /** as camadas ligadas no mapa (as outras aparecem esmaecidas) */
  activeLayers: string[]
  /** a nova ordem, de cima para baixo */
  onChange: (topToBottom: string[]) => void
  /** a ordem é a que o Prisma abre */
  isDefault: boolean
  onReset: () => void
  onBack: () => void
  /** existem ícones (as Ações), que o mapa sempre desenha por cima */
  hasIcons: boolean
}

export function LayerOrder({ items, activeLayers, onChange, isDefault, onReset, onBack, hasIcons }: LayerOrderProps) {
  const slugs = items.map((o) => o.slug)
  // quem usa leitor de tela não vê a linha andar: a frase diz onde a camada foi parar
  const [said, setSaid] = useState('')
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setDone(false), 2500)
    return () => clearTimeout(t)
  }, [done])

  const onMove = (next: string[], option: LayerManagerOption) => {
    onChange(next)
    setSaid(`${option.label}: posição ${next.indexOf(option.slug) + 1} de ${next.length}`)
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className={cn('flex h-8 items-center gap-1.5 pl-1.5 pr-3 text-sm font-medium', controlItem())}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Camadas
      </button>

      <PanelCard title="Ordem das camadas" caption="A de cima da lista fica por cima das outras no mapa. Arraste pela alça ou use as setas.">
        <Reorder.Group axis="y" values={slugs} onReorder={(next: string[]) => onChange(next)} className="m-0 p-0">
          {items.map((option, i) => (
            <Row key={option.slug} option={option} slugs={slugs} index={i} on={isLayerOn(option.slug, activeLayers)} onMove={onMove} />
          ))}
        </Reorder.Group>
        <p className="sr-only" role="status" aria-live="polite">{said}</p>
        <p className="mt-3 text-xs leading-snug text-muted-foreground">
          As desligadas aparecem esmaecidas e guardam o lugar delas.{hasIcons ? ' Os ícones, como os das Ações, ficam sempre por cima.' : ''} A ordem fica guardada neste aparelho.
        </p>
      </PanelCard>

      <button
        type="button"
        aria-disabled={isDefault && !done}
        onClick={() => { if (isDefault) return; onReset(); setDone(true) }}
        className={cn('flex h-10 w-full items-center justify-center gap-2 text-sm font-medium aria-disabled:opacity-45 aria-disabled:hover:bg-transparent', controlItem())}
      >
        {done ? <Check className="h-4 w-4 text-ok" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
        <span aria-live="polite">{done ? 'Voltou à ordem padrão' : isDefault ? 'Já está na ordem padrão' : 'Voltar à ordem padrão'}</span>
      </button>
    </div>
  )
}
