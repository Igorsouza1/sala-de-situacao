'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { SeriesStats } from '@/lib/geo-import/class-series'
import { MONTHS, MONTH_SHORT } from '@/lib/geo-import/months'

// Série de fogo por mês (DESIGN.md 13.12, "Fogo por mês"): quanto queimou em cada ano e, no ano escolhido, em que meses.
// Duas escolhas só (regra 1): o ano (as colunas de cima) e, se quiser, um mês (as de baixo); o mapa mostra exatamente isso, e a frase
// diz o que está no mapa (regra 7). Uma cor só, a de fogo (4.2): o escolhido fica cheio e o resto recua. As colunas são botões:
// respondem ao mouse e ao teclado, e cada uma diz em voz o ano (ou o mês) e os hectares.

interface FireSeriesViewProps {
  name: string
  stats: SeriesStats
  years: number[]
  year: number
  onYear: (year: number) => void
  /** só este mês no mapa (1 a 12); null: o ano todo */
  month: number | null
  onMonth: (month: number | null) => void
  /** o gráfico não mexe no mapa (painel Situação): as frases falam do gráfico, não do mapa */
  mapless?: boolean
}

/** hectares em palavras curtas: "437", "2,2 mil", "110 mil" */
function haShort(v: number): string {
  if (v < 1000) return Math.round(v).toLocaleString('pt-BR')
  return `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: v < 10_000 ? 1 : 0 })} mil`
}
const haText = (v: number) => `${haShort(v)} ${Math.round(v) === 1 ? 'hectare' : 'hectares'}`

export function FireSeriesView({ name, stats, years, year, onYear, month, onMonth, mapless = false }: FireSeriesViewProps) {
  const { totals, byMonth } = useMemo(() => {
    const totals = stats.ha.map((row) => row.reduce((a, b) => a + b, 0))
    const byMonth = stats.ha.map((row) => {
      const m = new Array(12).fill(0)
      stats.classes.forEach((c, k) => { if (c >= 1 && c <= 12) m[c - 1] += row[k] })
      return m as number[]
    })
    return { totals, byMonth }
  }, [stats])

  const k = Math.max(0, years.indexOf(year))
  const maxYear = Math.max(1, ...totals)
  const peakYear = totals.indexOf(Math.max(...totals))
  const months = byMonth[k]
  const maxMonth = Math.max(1, ...months)
  const peakMonth = months.indexOf(Math.max(...months))
  const burnedThisYear = totals[k] > 0

  const yearCaption = `O ano de mais fogo foi ${years[peakYear]}, com ${haText(totals[peakYear])}.`
  const monthCaption = month
    ? `${mapless ? 'Em' : 'O mapa mostra só'} ${MONTHS[month - 1]} de ${year}: ${haText(months[month - 1])}.`
    : burnedThisYear
      ? `Mais fogo em ${MONTHS[peakMonth]}: ${haText(months[peakMonth])}.${mapless ? '' : ' Clique num mês para ver só ele no mapa.'}`
      : `Não houve fogo em ${year}.`

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium">Hectares queimados por ano</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{yearCaption}</p>
        <div role="group" aria-label={mapless ? `Ano de ${name}` : `Ano de ${name} no mapa`} className="mt-3 flex h-32 items-end gap-1.5">
          {years.map((y, i) => (
            <button
              key={y}
              type="button"
              onClick={() => { onYear(y); onMonth(null) }}
              aria-pressed={i === k}
              aria-label={`${y}: ${haText(totals[i])} queimados`}
              className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-sm focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
            >
              <span className="mb-1 font-mono text-xs tabular-nums text-muted-foreground">{haShort(totals[i])}</span>
              <span
                aria-hidden
                className={cn('w-full max-w-10 rounded-t-[4px] transition-colors duration-200', i === k ? 'bg-crit' : 'bg-crit/35 group-hover:bg-crit/60')}
                style={{ height: `${(totals[i] / maxYear) * 72}px`, minHeight: totals[i] ? 2 : 0 }}
              />
              <span className={cn('mt-1 w-full border-t border-border pt-1 font-mono text-xs tabular-nums', i === k ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {y}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium">Em {year}, mês a mês</p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground" aria-live="polite">{monthCaption}</p>
        <div role="group" aria-label={mapless ? `Mês de ${year}` : `Mês de ${year} no mapa`} className="mt-3 flex h-20 items-end gap-1">
          {months.map((v, i) => {
            const chosen = month === i + 1
            return (
              <button
                key={i}
                type="button"
                disabled={!v && !chosen}
                onClick={() => onMonth(chosen ? null : i + 1)}
                aria-pressed={chosen}
                aria-label={`${MONTHS[i]} de ${year}: ${haText(v)}`}
                title={`${MONTHS[i]}: ${haText(v)}`}
                className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end rounded-sm disabled:cursor-default focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
              >
                <span
                  aria-hidden
                  className={cn(
                    'w-full rounded-t-[3px] transition-colors duration-200',
                    chosen ? 'bg-crit' : month ? 'bg-crit/25 group-hover:bg-crit/50' : 'bg-crit/70 group-hover:bg-crit',
                  )}
                  style={{ height: `${(v / maxMonth) * 52}px`, minHeight: v ? 2 : 0 }}
                />
                <span className={cn('mt-1 w-full border-t border-border pt-1 text-xs', chosen ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                  {MONTH_SHORT[i][0].toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
        {month && (
          <button type="button" onClick={() => onMonth(null)} className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline">
            Ver o ano todo
          </button>
        )}
      </div>
    </div>
  )
}
