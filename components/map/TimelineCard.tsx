'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { FonteTempo } from '@/types/map-linha-do-tempo'
import { datesOf, defaultSource, fillMonths, selectionOf, SOURCE_LABEL } from './helpers/timeline'
import { TimelineChart } from './TimelineChart'
import { useLinhaDoTempo } from './useLinhaDoTempo'

// O conteúdo do cartão "Quando aconteceu" (DESIGN.md 13.9): três botões em segmento (Focos, Desmatamento, Ações), um histograma por vez
// e a frase do que está valendo. O segmento só troca qual histograma se vê; o período escolhido filtra as três camadas (é o do cartão
// Período). Todos os estados são desenhados: carregando (esqueleto da forma do gráfico), erro (com a saída) e vazio (com o porquê).

const SOURCES: FonteTempo[] = ['focos', 'desmatamento', 'acoes']

interface TimelineCardProps {
  regiaoId?: number
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
}

export function TimelineCard({ regiaoId, startDate, endDate, onDateChange }: TimelineCardProps) {
  const { data, error, loading, retry } = useLinhaDoTempo(regiaoId)
  const now = useMemo(() => new Date(), [])
  const [picked, setPicked] = useState<FonteTempo | null>(null)
  const source = picked ?? (data ? defaultSource(data, now) : 'focos')
  const bars = useMemo(() => (data ? fillMonths(data[source], now) : []), [data, source, now])

  if (error) {
    return (
      <div role="alert">
        <p className="text-sm font-semibold">Não foi possível carregar o histórico</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Os filtros abaixo continuam funcionando.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={retry}>Tentar de novo</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Fonte do histórico" className="grid grid-cols-3 gap-1 rounded-md border border-border bg-card p-1">
        {SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={source === s}
            onClick={() => setPicked(s)}
            className={cn(
              'flex h-9 items-center justify-center rounded-sm px-1 text-sm font-medium transition-[background-color,color,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
              source === s ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {SOURCE_LABEL[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div role="status" aria-busy>
          <span className="sr-only">Buscando o histórico…</span>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="mt-4 h-4 w-2/3" />
        </div>
      ) : bars.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Ainda não há {SOURCE_LABEL[source].toLowerCase()} registrados nesta região.</p>
      ) : (
        <TimelineChart
          bars={bars}
          source={source}
          selection={selectionOf(bars, startDate, endDate)}
          onSelect={(from, to) => { const [start, end] = datesOf(bars, from, to); onDateChange(start, end) }}
        />
      )}
    </div>
  )
}
