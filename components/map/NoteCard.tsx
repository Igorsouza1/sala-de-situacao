'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { PanelCard } from './PanelCard'
import { Segmented } from './Segmented'
import type { Notes } from './helpers/gerar-mapa'

// O texto livre: a pessoa escolhe ONDE (um desenho da folha mostra o lugar, e uma frase o diz) e escreve. Cada lugar guarda o seu texto;
// o ponto verde no nome marca onde já há texto. Vazio não aparece na folha: não há interruptor para pensar.
type Place = keyof Notes

const WHERE: Record<Place, string> = {
  title: 'Fica logo abaixo do título, na largura da folha.',
  map: 'Fica no alto do mapa, por cima da imagem.',
  side: 'Fica na coluna ao lado do mapa, embaixo da legenda.',
}

// a folha em miniatura, com o lugar do texto em verde
function PlaceDiagram({ place, side }: { place: Place; side: boolean }) {
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16 shrink-0" role="img" aria-label="Lugar do texto na folha">
      <rect x="0.5" y="0.5" width="63" height="43" rx="2.5" className="fill-card stroke-border" />
      <rect x="6" y="4" width="26" height="3" rx="1" className="fill-foreground/35" />
      <rect x="6" y="13" width={side ? 38 : 52} height="26" rx="1" className="fill-muted stroke-foreground/40" strokeWidth="0.8" />
      {side && <rect x="48" y="13" width="10" height="26" rx="1" className="fill-muted stroke-foreground/40" strokeWidth="0.8" />}
      {side && <rect x="49.5" y="15" width="7" height="8" rx="0.8" className="fill-foreground/25" />}
      {place === 'title' && <rect x="6" y="8.4" width="52" height="3" rx="1" className="fill-primary" />}
      {place === 'map' && <rect x="14" y="15.5" width={side ? 22 : 36} height="4.5" rx="1" className="fill-primary" />}
      {place === 'side' && <rect x="49.5" y="25" width="7" height="12" rx="0.8" className="fill-primary" />}
    </svg>
  )
}

const label = (text: string, filled: boolean) => (
  <span className="relative">
    {text}
    {filled && <span aria-hidden className="absolute -right-2 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
  </span>
)

export function NoteCard({ notes, onChange, sideActive }: { notes: Notes; onChange: (place: Place, text: string) => void; sideActive: boolean }) {
  const [picked, setPicked] = useState<Place>('title')
  // o lugar "ao lado" só existe com a legenda ao lado; sem ela, o campo volta para o primeiro
  const place = picked === 'side' && !sideActive ? 'title' : picked
  const options: { value: Place; label: React.ReactNode }[] = [
    { value: 'title', label: label('Sob o título', notes.title.trim() !== '') },
    { value: 'map', label: label('No mapa', notes.map.trim() !== '') },
    ...(sideActive ? [{ value: 'side' as const, label: label('Ao lado', notes.side.trim() !== '') }] : []),
  ]
  return (
    <PanelCard title="Texto livre" caption="Escolha onde o texto fica e escreva. Onde não houver texto, nada aparece.">
      <div className="space-y-4">
        <Segmented label="Onde o texto fica" value={place} options={options} onChange={setPicked} />
        <div className="flex items-center gap-3">
          <PlaceDiagram place={place} side={sideActive} />
          <p className="text-sm text-muted-foreground">{WHERE[place]}</p>
        </div>
        <Textarea
          aria-label="Texto livre"
          value={notes[place]}
          placeholder="Escreva o texto"
          maxLength={240}
          rows={3}
          className="min-h-0 resize-none"
          onChange={(e) => onChange(place, e.target.value)}
        />
      </div>
    </PanelCard>
  )
}
