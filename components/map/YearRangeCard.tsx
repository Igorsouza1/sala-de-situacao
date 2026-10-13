'use client'

import { Slider } from '@/components/ui/slider'
import { Collapse } from '@/components/ui/collapse'
import { cn } from '@/lib/utils'
import { controlSurface } from './helpers/control-style'

// Período de cada camada importada que tem anos (DESIGN.md 13): fica no mapa enquanto a camada está ligada, para a pessoa ver e
// mexer no recorte sem abrir painel. Uma linha por camada, com o nome, o período em palavras e o controle de dois pontos.
// Cada camada tem o seu período: o filtro de datas do mapa (Este ano…) não mexe nas camadas importadas.

export interface YearRangeItem {
  slug: string
  name: string
  min: number
  max: number
  value: [number, number]
}

interface YearRangeCardProps {
  items: YearRangeItem[]
  onChange: (slug: string, value: [number, number]) => void
}

const label = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a} a ${b}`)

export function YearRangeCard({ items, onChange }: YearRangeCardProps) {
  const open = items.length > 0
  return (
    <div className="pointer-events-none absolute right-[4.25rem] top-4 z-[400] w-72 max-sm:inset-x-3 max-sm:right-auto max-sm:top-16 max-sm:w-auto">
      <Collapse open={open} clip>
        <section aria-label="Período das camadas" className={cn('pointer-events-auto rounded-lg p-4', controlSurface)}>
          <h3 className="mb-3 text-sm font-semibold">Período</h3>
          <ul className="space-y-5">
            {items.map((item) => (
              <li key={item.slug}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-sm">{item.name}</span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">{label(item.value)}</span>
                </div>
                <div className="py-2">
                  <Slider
                    min={item.min}
                    max={item.max}
                    step={1}
                    minStepsBetweenThumbs={0}
                    value={item.value}
                    onValueChange={(v) => v.length === 2 && onChange(item.slug, [v[0], v[1]])}
                    aria-label={`Período de ${item.name}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </Collapse>
    </div>
  )
}
