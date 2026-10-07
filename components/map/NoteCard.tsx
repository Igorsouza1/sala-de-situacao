'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapse } from '@/components/ui/collapse'
import { PanelCard } from './PanelCard'
import { Segmented } from './Segmented'
import { controlItem } from './helpers/control-style'
import {
  BLOCK_FONTS,
  BLOCK_FONT_LABELS,
  BLOCK_SIZES,
  BLOCK_SIZE_LABELS,
  BLOCK_STYLES,
  BLOCK_STYLE_LABELS,
  MAX_BLOCKS,
  type BlockLook,
  type MapBlock,
} from './helpers/gerar-mapa'

// O texto livre: "Adicionar texto" põe um bloco na folha, e a pessoa escreve direto nele e o arrasta para onde quiser. Aqui só moram o botão
// e o jeito do texto escolhido (estilo, tamanho e letra), com a folha à vista para ver o resultado.
const STYLE_OPTIONS = BLOCK_STYLES.map((value) => ({ value, label: BLOCK_STYLE_LABELS[value] }))
const SIZE_OPTIONS = BLOCK_SIZES.map((value) => ({ value, label: BLOCK_SIZE_LABELS[value] }))
const FONT_OPTIONS = BLOCK_FONTS.map((value) => ({ value, label: BLOCK_FONT_LABELS[value] }))

interface NoteCardProps {
  blocks: MapBlock[]
  /** o bloco escolhido na folha: é o dele o jeito que se ajusta aqui */
  selected: MapBlock | null
  onAdd: () => void
  onLook: (patch: Partial<BlockLook>) => void
  onRemove: () => void
}

export function NoteCard({ blocks, selected, onAdd, onLook, onRemove }: NoteCardProps) {
  const full = blocks.length >= MAX_BLOCKS
  const caption = full
    ? 'Oito textos é o máximo. Remova um para adicionar outro.'
    : blocks.length === 0
      ? 'Adicione um texto, escreva direto na folha e arraste para onde quiser.'
      : selected
        ? 'Escreva direto na folha e arraste pela alça.'
        : 'Toque num texto da folha para escrever ou mudar o jeito dele.'
  return (
    <PanelCard title="Texto livre" caption={caption}>
      <button
        type="button"
        onClick={onAdd}
        aria-disabled={full}
        className={cn('flex h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium', controlItem(), full && 'opacity-50')}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Adicionar texto
      </button>
      <Collapse open={!!selected} clip>
        <div className="space-y-4 pt-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Estilo</p>
            <Segmented label="Estilo do texto" value={selected?.style ?? 'plate'} options={STYLE_OPTIONS} onChange={(style) => onLook({ style })} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Tamanho</p>
            <Segmented label="Tamanho do texto" value={selected?.size ?? 'm'} options={SIZE_OPTIONS} onChange={(size) => onLook({ size })} />
          </div>
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Letra</p>
            <Segmented label="Letra do texto" value={selected?.font ?? 'normal'} options={FONT_OPTIONS} onChange={(font) => onLook({ font })} />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onRemove} className={cn('flex h-10 items-center px-3 text-sm font-medium', controlItem())}>
              Remover este texto
            </button>
          </div>
        </div>
      </Collapse>
    </PanelCard>
  )
}
