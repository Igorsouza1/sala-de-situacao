'use client'

import { Button } from '@/components/ui/button'
import { DateFilterControl } from './DateFilterControl'
import { PanelCard } from './PanelCard'
import { PropertyFilterControl } from './PropertyFilterControl'
import { activeFilterCount, filterSummary, type AreaFilter } from './helpers/filters'
import { affectsLine } from './helpers/layers'

// Painel Filtros (DESIGN.md 13.1): tudo aplica na hora, a frase de cima diz o que está valendo e "Limpar tudo" desfaz.
// Os filtros não são globais: cada um diz em que camadas vale, e avisa se nenhuma delas está ligada.
// O dock mostra quantos filtros estão ligados, para quem fechou o painel não achar que o mapa está vazio por acaso.

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
  return (
    <div className="space-y-4">
      <p role="status" className="px-1 text-sm">{filterSummary(startDate, endDate, area)}</p>

      <PanelCard title="Período" caption={affectsLine(dateAffects.names, dateAffects.anyOn, 'Período')}>
        <DateFilterControl startDate={startDate} endDate={endDate} onChange={onDateChange} />
      </PanelCard>

      <PanelCard title="Propriedades" caption={affectsLine(areaAffects.names, areaAffects.anyOn, 'Propriedades')}>
        <PropertyFilterControl value={area} onChange={onAreaChange} />
      </PanelCard>

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
