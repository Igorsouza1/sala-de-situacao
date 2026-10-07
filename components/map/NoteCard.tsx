'use client'

import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { PanelCard } from './PanelCard'
import { Segmented } from './Segmented'
import { controlItem } from './helpers/control-style'
import { MAX_BLOCKS, type MapBlock, type Notes } from './helpers/gerar-mapa'

// O texto livre: a pessoa escolhe ONDE (um desenho da folha mostra o lugar e uma frase o diz) e escreve. "Sob o título" e "Ao lado" têm
// um lugar fixo, cada um com o seu texto. "No mapa" são blocos soltos, que se arrastam na folha para onde a pessoa quiser. O ponto verde
// no nome marca onde já há texto. Vazio não aparece na folha: não há interruptor para pensar.
type Place = 'title' | 'map' | 'side'

const WHERE: Record<Place, string> = {
  title: 'Fica logo abaixo do título, na largura da folha.',
  map: 'Cada texto fica sobre o mapa. Arraste-o na folha para onde quiser.',
  side: 'Abre uma coluna ao lado do mapa, embaixo da legenda. O mapa fica um pouco menor.',
}
const WHERE_PORTRAIT_SIDE = 'Só na folha deitada. Mude a posição da folha, em "Folha", para usar.'

// a folha em miniatura, com o lugar do texto em verde
function PlaceDiagram({ place, side }: { place: Place; side: boolean }) {
  const showSide = side || place === 'side'
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16 shrink-0" role="img" aria-label="Lugar do texto na folha">
      <rect x="0.5" y="0.5" width="63" height="43" rx="2.5" className="fill-card stroke-border" />
      <rect x="6" y="4" width="26" height="3" rx="1" className="fill-foreground/35" />
      <rect x="6" y="13" width={showSide ? 38 : 52} height="26" rx="1" className="fill-muted stroke-foreground/40" strokeWidth="0.8" />
      {showSide && <rect x="48" y="13" width="10" height="26" rx="1" className="fill-muted stroke-foreground/40" strokeWidth="0.8" />}
      {showSide && <rect x="49.5" y="15" width="7" height="8" rx="0.8" className="fill-foreground/25" />}
      {place === 'title' && <rect x="6" y="8.4" width="52" height="3" rx="1" className="fill-primary" />}
      {place === 'map' && <rect x="18" y="22" width="20" height="5" rx="1" className="fill-primary" />}
      {place === 'side' && <rect x="49.5" y="25" width="7" height="12" rx="0.8" className="fill-primary" />}
    </svg>
  )
}

const label = (text: string, filled: boolean): ReactNode => (
  <span className="relative">
    {text}
    {filled && <span aria-hidden className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
  </span>
)

interface NoteCardProps {
  notes: Notes
  onNote: (place: 'title' | 'side', text: string) => void
  /** a folha está deitada: só nela existe a coluna ao lado */
  landscape: boolean
  blocks: MapBlock[]
  selected: string | null
  onSelect: (id: string | null) => void
  /** cria um bloco no mapa e devolve o id dele */
  onAdd: () => string
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
}

export function NoteCard({ notes, onNote, landscape, blocks, selected, onSelect, onAdd, onEdit, onRemove }: NoteCardProps) {
  const [picked, setPicked] = useState<Place>('title')
  const [fresh, setFresh] = useState<string | null>(null)
  // em pé não há coluna ao lado: o campo volta para o primeiro lugar
  const place = picked === 'side' && !landscape ? 'title' : picked
  const options: { value: Place; label: ReactNode; disabled?: boolean }[] = [
    { value: 'title', label: label('Sob o título', notes.title.trim() !== '') },
    { value: 'map', label: label('No mapa', blocks.some((b) => b.text.trim() !== '')) },
    { value: 'side', label: label('Ao lado', notes.side.trim() !== ''), disabled: !landscape },
  ]
  const add = () => { setFresh(onAdd()) }

  return (
    <PanelCard title="Texto livre" caption="Escolha onde o texto fica e escreva. Onde não houver texto, nada aparece.">
      <div className="space-y-4">
        <Segmented label="Onde o texto fica" value={place} options={options} onChange={setPicked} />
        <div className="flex items-center gap-3">
          <PlaceDiagram place={place} side={landscape && notes.side.trim() !== ''} />
          <p className="text-sm text-muted-foreground">{!landscape && picked === 'side' ? WHERE_PORTRAIT_SIDE : WHERE[place]}</p>
        </div>

        {place !== 'map' && (
          <Textarea
            aria-label={place === 'title' ? 'Texto abaixo do título' : 'Texto ao lado do mapa'}
            value={place === 'title' ? notes.title : notes.side}
            placeholder="Escreva o texto"
            maxLength={240}
            rows={3}
            className="min-h-0 resize-none"
            onChange={(e) => onNote(place, e.target.value)}
          />
        )}

        {place === 'map' && (
          <div className="space-y-3">
            {blocks.map((b, i) => (
              <div key={b.id} className={cn('rounded-md border p-2 transition-[border-color,background-color] duration-200', selected === b.id ? 'border-primary bg-secondary/40' : 'border-border')}>
                <Textarea
                  aria-label={`Texto ${i + 1} sobre o mapa`}
                  value={b.text}
                  placeholder="Escreva o texto"
                  maxLength={240}
                  rows={2}
                  autoFocus={b.id === fresh}
                  className="min-h-0 resize-none"
                  onFocus={() => onSelect(b.id)}
                  onChange={(e) => onEdit(b.id, e.target.value)}
                />
                <div className="mt-1 flex justify-end">
                  <button type="button" onClick={() => onRemove(b.id)} className={cn('flex h-10 items-center px-3 text-sm font-medium', controlItem())}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
            {blocks.length < MAX_BLOCKS ? (
              <button type="button" onClick={add} className={cn('flex h-12 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm font-medium', controlItem())}>
                <Plus className="h-4 w-4" aria-hidden />
                Adicionar texto no mapa
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">Cinco textos no mapa é o máximo. Remova um para adicionar outro.</p>
            )}
          </div>
        )}
      </div>
    </PanelCard>
  )
}
