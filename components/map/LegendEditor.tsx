'use client'

import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Legend } from './LayerManager'
import { ColorSwatch, IconSwatch } from './MapLegend'
import { controlItem } from './helpers/control-style'
import {
  DEFAULT_LEGEND_TITLE,
  EMPTY_LEGEND_EDITS,
  applyLegendEdits,
  isLegendEdited,
  moveBy,
  setSiblingOrder,
  type LegendEdits,
  type LegendItem,
  type LegendSection,
} from './helpers/legend-sheet'

// O editor da legenda da folha (Gerar mapa): renomear (toque no nome), esconder (interruptor, a última coluna) e reordenar (arrastar a
// alça, ou as setas do teclado com a alça em foco). Só mexe na folha: a camada e a cor continuam no mapa como estão.

function Swatch({ item }: { item: LegendItem }) {
  const s = item.swatch
  if (s.kind === 'color') return <ColorSwatch color={s.color} />
  if (s.kind === 'icon') return <IconSwatch name={s.iconName} />
  return <Legend option={s.option} checked={true} />
}

interface Ctx {
  edits: LegendEdits
  onChange: (edits: LegendEdits) => void
}

function Row({ item, siblings, ctx }: { item: LegendItem; siblings: string[]; ctx: Ctx }) {
  const controls = useDragControls()
  const { edits, onChange } = ctx
  const shown = !edits.hidden.includes(item.id)
  const move = (delta: -1 | 1) => onChange({ ...edits, order: setSiblingOrder(edits.order, moveBy(siblings, item.id, delta)) })
  return (
    <Reorder.Item value={item.id} dragListener={false} dragControls={controls} className="list-none">
      <div className="flex min-h-12 items-center gap-2 py-1">
        <button
          type="button"
          title="Arraste para mudar a ordem"
          aria-label={`Mudar a ordem de ${item.label}. Arraste, ou use as setas para cima e para baixo.`}
          onPointerDown={(e) => controls.start(e)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); move(e.key === 'ArrowUp' ? -1 : 1) }
          }}
          className={cn('flex h-10 w-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing', controlItem())}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <span className={cn('transition-opacity duration-200', !shown && 'opacity-40')}><Swatch item={item} /></span>
        <Input
          aria-label={`Nome de ${item.label} na legenda`}
          value={edits.labels[item.id] ?? item.label}
          placeholder={item.label}
          onChange={(e) => onChange({ ...edits, labels: { ...edits.labels, [item.id]: e.target.value } })}
          className={cn('h-10 min-w-0 flex-1 transition-opacity duration-200', !shown && 'opacity-50')}
        />
        <Switch
          checked={shown}
          aria-label={`Mostrar ${item.label} na legenda`}
          onCheckedChange={(on) => onChange({ ...edits, hidden: on ? edits.hidden.filter((id) => id !== item.id) : [...edits.hidden, item.id] })}
        />
      </div>
      {item.children.length > 0 && (
        <div className="ml-4 border-l border-border pl-3">
          <Group items={item.children} ctx={ctx} />
        </div>
      )}
    </Reorder.Item>
  )
}

function Group({ items, ctx }: { items: LegendItem[]; ctx: Ctx }) {
  const ids = items.map((i) => i.id)
  return (
    <Reorder.Group axis="y" values={ids} onReorder={(next: string[]) => ctx.onChange({ ...ctx.edits, order: setSiblingOrder(ctx.edits.order, next) })} className="m-0 p-0">
      {items.map((i) => <Row key={i.id} item={i} siblings={ids} ctx={ctx} />)}
    </Reorder.Group>
  )
}

export function LegendEditor({ sections, edits, onChange }: { sections: LegendSection[]; edits: LegendEdits; onChange: (edits: LegendEdits) => void }) {
  // a lista mostra a ordem escolhida e todos os itens (os escondidos ficam, esmaecidos, para voltar a ligar), com os nomes do mapa
  const listed = applyLegendEdits(sections, { ...EMPTY_LEGEND_EDITS, order: edits.order })
  const ctx: Ctx = { edits, onChange }
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="legenda-titulo" className="mb-2 block text-sm text-muted-foreground">Título da legenda</label>
        <Input id="legenda-titulo" value={edits.title} placeholder={DEFAULT_LEGEND_TITLE} onChange={(e) => onChange({ ...edits, title: e.target.value })} />
      </div>
      {listed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Não há camadas ligadas, então a legenda fica vazia. Ligue camadas no mapa para elas aparecerem aqui.</p>
      ) : (
        listed.map((s) => (
          <div key={s.id}>
            {s.title && <p className="mb-1 text-sm font-medium">{s.title}</p>}
            <Group items={s.items} ctx={ctx} />
          </div>
        ))
      )}
      {isLegendEdited(edits) && (
        <button type="button" onClick={() => onChange(EMPTY_LEGEND_EDITS)} className={cn('flex h-10 items-center gap-2 px-2 text-sm font-medium', controlItem())}>
          <Undo2 className="h-4 w-4" aria-hidden />
          Voltar à legenda do mapa
        </button>
      )}
    </div>
  )
}
