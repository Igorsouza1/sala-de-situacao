'use client'

import { CalendarRange, LandPlot, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DateFilterControl } from './DateFilterControl'
import { PanelCard } from './PanelCard'
import { PropertyFilterControl } from './PropertyFilterControl'
import { activeFilterCount, filterSummary, type AreaFilter } from './helpers/filters'
import { affectsLine } from './helpers/layers'

// Painel Filtros (DESIGN.md 13.1): tudo aplica na hora, o cartão de cima diz o que está valendo e "Limpar tudo" desfaz.
// Os filtros não são globais: cada um diz em que camadas vale, e avisa se nenhuma delas está ligada.
// O dock mostra quantos filtros estão ligados, para quem fechou o painel não achar que o mapa está vazio por acaso.
// Cada cartão tem um ícone (o assunto de relance) e diz "Ligado" quando está mexendo no mapa (regra 7).

interface Affected {
  /** nomes das camadas em que o filtro vale */
  names: string[]
  /** alguma delas está ligada */
  anyOn: boolean
}

interface FiltersPanelProps {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  area: AreaFilter
  onAreaChange: (filter: AreaFilter) => void
  dateAffects: Affected
  areaAffects: Affected
}

export function FiltersPanel({ startDate, endDate, onDateChange, area, onAreaChange, dateAffects, areaAffects }: FiltersPanelProps) {
  const count = activeFilterCount(startDate, endDate, area)
  const dateActive = !!(startDate || endDate)
  const areaActive = area.minArea !== undefined || area.maxArea !== undefined
  const title = count === 0 ? 'Nenhum filtro ligado' : count === 1 ? '1 filtro ligado' : `${count} filtros ligados`
  const sentence = count === 0 ? 'O mapa mostra tudo.' : filterSummary(startDate, endDate, area)

  // O título diz que o filtro é o tamanho; a frase diz a unidade e que dá para limitar só um lado (nada de decifrar "ha").
  const areaAffectsLine = affectsLine(areaAffects.names, areaAffects.anyOn, 'Propriedades')
  const areaCaption = <>Em hectares (ha). Deixe um lado vazio para não limitar.{areaAffectsLine && <> {areaAffectsLine}</>}</>

  return (
    <div className="panel-rise space-y-4">
      {/* Resumo: diz em cor e em frase se há filtro (verde claro) ou não (neutro). Só o texto é refeito e pisca em verde claro
          quando muda, para a pessoa ver o que o clique dela mudou (8.4); o cartão em si não pisca, para não perder o fundo. */}
      <section role="status" className={cn('flex items-center gap-3 rounded-lg border p-4 transition-colors duration-300', count > 0 ? 'border-primary/30 bg-secondary/60' : 'border-border bg-card')}>
        <span aria-hidden className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-300', count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h4 key={title} className="animate-in fade-in-0 text-sm font-semibold duration-300">{title}</h4>
          <p key={sentence} className="animate-found -mx-1 mt-0.5 rounded-sm px-1 text-xs leading-snug text-muted-foreground">{sentence}</p>
        </div>
      </section>

      <PanelCard title="Período" icon={CalendarRange} active={dateActive} caption={affectsLine(dateAffects.names, dateAffects.anyOn, 'Período')}>
        <DateFilterControl startDate={startDate} endDate={endDate} onChange={onDateChange} />
      </PanelCard>

      <PanelCard title="Tamanho da propriedade" icon={LandPlot} active={areaActive} caption={areaCaption}>
        <PropertyFilterControl value={area} onChange={onAreaChange} />
      </PanelCard>

      {/* numa div: o movimento de entrada do painel (.panel-rise) não pode pisar no hover do botão.
          pt-4 (padding, não margem) soma ao espaço de 16 e dá 32 antes da barra de ação (6.3, C16). */}
      <div className="pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          aria-disabled={count === 0}
          title={count === 0 ? 'Não há filtro para limpar.' : undefined}
          onClick={() => { if (count === 0) return; onDateChange(null, null); onAreaChange({}) }}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Limpar tudo
        </Button>
      </div>
    </div>
  )
}
