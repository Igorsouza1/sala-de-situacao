'use client'

import { Button } from '@/components/ui/button'
import { DateFilterControl } from './DateFilterControl'
import { PropertyFilterControl } from './PropertyFilterControl'
import { activeFilterCount, filterSummary, type AreaFilter } from './helpers/filters'

// Painel Filtros (DESIGN.md 13): tudo aplica na hora, a frase de cima diz o que está valendo e "Limpar tudo" desfaz.
// O dock mostra quantos filtros estão ligados, para quem fechou o painel não achar que o mapa está vazio por acaso.

interface FiltersPanelProps {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (start: Date | null, end: Date | null) => void
  area: AreaFilter
  onAreaChange: (filter: AreaFilter) => void
}

export function FiltersPanel({ startDate, endDate, onDateChange, area, onAreaChange }: FiltersPanelProps) {
  const count = activeFilterCount(startDate, endDate, area)
  return (
    <div className="space-y-5">
      <p role="status" className="text-sm text-muted-foreground">{filterSummary(startDate, endDate, area)}</p>
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período</h4>
        <DateFilterControl startDate={startDate} endDate={endDate} onChange={onDateChange} />
      </section>
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Propriedade</h4>
        <PropertyFilterControl value={area} onChange={onAreaChange} />
      </section>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        aria-disabled={count === 0}
        onClick={() => { if (count === 0) return; onDateChange(null, null); onAreaChange({}) }}
      >
        Limpar tudo
      </Button>
    </div>
  )
}
