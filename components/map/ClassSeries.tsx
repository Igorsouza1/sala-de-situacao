'use client'

import { useMemo } from 'react'
import { Bar, BarChart, Cell, Tooltip, XAxis, type TooltipProps } from 'recharts'
import { Slider } from '@/components/ui/slider'
import { OTHERS, chartClasses, yearRow, type SeriesStats } from '@/lib/geo-import/class-series'
import { classInfo } from '@/lib/geo-import/mapbiomas'

// Série de anos de um raster de classes (DESIGN.md 13, "Série de anos"): como a área se divide entre as classes, ano a ano.
//
// Forma: barras empilhadas, uma por ano, cada barra a área inteira (a área recortada é a mesma todo ano; o que muda é a divisão).
// Cores: as da legenda do MapBiomas, as mesmas do mapa (regra 12: a amostra é o que o mapa desenha). No máximo 8 cores; as classes
// pequenas somam em "Outras". O ano mostrado no mapa fica em cor cheia e os outros recuam; clicar numa barra leva o mapa àquele ano.
// Embaixo, a lista do ano mostrado é a legenda E a tabela: nome, quanto ocupa e quanto ocupava no primeiro ano (a conclusão, não a conta).

const nameOf = (c: number) => (c === OTHERS ? 'Outras classes' : classInfo(c).name)
const colorOf = (c: number) => (c === OTHERS ? 'var(--color-recuo)' : classInfo(c).color)

function pct(share: number): string {
  if (share > 0 && share < 0.01) return 'menos de 1%'
  return `${Math.round(share * 100).toLocaleString('pt-BR')}%`
}

interface Row { year: number; total: number; [key: `c${number}`]: number }

function useSeriesData(stats: SeriesStats, years: number[]) {
  return useMemo(() => {
    const shown = chartClasses(stats)
    const rows: Row[] = years.map((year, k) => {
      const r = yearRow(stats, k, shown)
      const row: Row = { year, total: 0 }
      for (const c of shown) {
        row[`c${c}`] = r.get(c) ?? 0
        row.total += r.get(c) ?? 0
      }
      return row
    })
    return { shown, rows }
  }, [stats, years])
}

/** As marcas do eixo: o primeiro e o último ano e as décadas que não encostam neles. */
function axisTicks(years: number[]): number[] {
  const first = years[0]
  const last = years[years.length - 1]
  const decades = years.filter((y) => y % 10 === 0 && y - first >= 4 && last - y >= 4)
  return [first, ...decades, last]
}

function SeriesTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as Row
  const items = payload
    .map((p) => ({ c: Number(String(p.dataKey).slice(1)), v: Number(p.value) }))
    .filter((i) => i.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 4)
  return (
    <div className="pointer-events-none min-w-44 animate-in fade-in-0 rounded-[14px] border border-border bg-card px-3 py-2.5 shadow-[0_1px_2px_rgb(24_26_25/0.06),0_4px_14px_rgb(24_26_25/0.05)] duration-150">
      <p className="mb-1.5 font-mono text-sm font-semibold tabular-nums">{label}</p>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.c} className="flex items-center gap-2 text-xs">
            <Swatch color={colorOf(i.c)} />
            <span className="min-w-0 flex-1 truncate">{nameOf(i.c)}</span>
            <span className="font-mono tabular-nums">{pct(i.v / row.total)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-xs text-muted-foreground">Clique para ver no mapa.</p>
    </div>
  )
}

/** A amostra é o que o mapa desenha, com o fio de pedra por fora para a cor clara (pastagem, mosaico) aparecer no cartão branco. */
function Swatch({ color }: { color: string }) {
  return <span aria-hidden className="h-3 w-3 shrink-0 rounded-[3px] ring-1 ring-stone" style={{ backgroundColor: color }} />
}

interface ClassSeriesViewProps {
  stats: SeriesStats
  years: number[]
  /** o ano mostrado no mapa */
  year: number
  onYear: (year: number) => void
  /** nome da série, para o leitor de tela */
  name: string
}

/** Escolher o ano, o gráfico e a lista do ano mostrado. Serve à prévia (antes de salvar) e ao cartão no mapa. */
export function ClassSeriesView({ stats, years, year, onYear, name }: ClassSeriesViewProps) {
  const { shown, rows } = useSeriesData(stats, years)
  const k = Math.max(0, years.indexOf(year))
  const first = rows[0]
  const current = rows[k]
  const list = shown
    .map((c) => ({ c, now: current[`c${c}`] / current.total, then: first[`c${c}`] / first.total }))
    .filter((r) => r.now > 0 || r.then > 0)
    .sort((a, b) => (a.c === OTHERS ? 1 : b.c === OTHERS ? -1 : b.now - a.now))

  // o que mais mudou desde o primeiro ano, dito em frase para o leitor de tela (o gráfico é desenho)
  const biggest = [...list].filter((r) => r.c !== OTHERS).sort((a, b) => Math.abs(b.now - b.then) - Math.abs(a.now - a.then))[0]

  // um ano só: não há o que escolher nem o que comparar; fica a divisão da área daquele ano (a legenda e a tabela)
  const single = years.length === 1

  return (
    <div className="space-y-4">
      {!single && (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm">Ano no mapa</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{year}</span>
            </div>
            <div className="py-2">
              <Slider
                min={0}
                max={years.length - 1}
                step={1}
                value={[k]}
                onValueChange={(v) => v.length === 1 && onYear(years[v[0]])}
                aria-label={`Ano de ${name}`}
                aria-valuetext={`${year}`}
              />
            </div>
          </div>

          <figure className="m-0">
            <div
              role="img"
              aria-label={
                biggest
                  ? `Divisão da área por classe de ${years[0]} a ${years[years.length - 1]}. A maior mudança foi em ${nameOf(biggest.c)}: de ${pct(biggest.then)} para ${pct(biggest.now)} da área em ${year}.`
                  : `Divisão da área por classe de ${years[0]} a ${years[years.length - 1]}.`
              }
              className="cursor-pointer"
            >
              <BarChart
                width={288}
                height={132}
                data={rows}
                stackOffset="expand"
                barCategoryGap={1}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                onClick={(s) => { if (s?.activeLabel !== undefined) onYear(Number(s.activeLabel)) }}
              >
                <XAxis dataKey="year" ticks={axisTicks(years)} interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)', fontFamily: 'var(--font-mono, monospace)' }} />
                <Tooltip content={<SeriesTooltip />} cursor={{ fill: 'var(--color-secondary)', opacity: 0.6 }} isAnimationActive={false} />
                {/* Recharts 2.15 com React 19: séries em array com key, nunca em fragmento (DESIGN.md 16) */}
                {shown.map((c) => (
                  <Bar key={c} dataKey={`c${c}`} stackId="s" fill={colorOf(c)} stroke="var(--color-card)" strokeWidth={0.5} isAnimationActive={false}>
                    {rows.map((r, i) => (
                      <Cell key={r.year} fillOpacity={i === k ? 1 : 0.5} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </div>
          </figure>
        </div>
      )}

      <div>
        {!single && (
          <p className="mb-2 text-xs text-muted-foreground">
            Em {year}, comparado com {years[0]}
          </p>
        )}
        <ul className="space-y-2">
          {list.map((r) => (
            <li key={r.c} className="flex items-center gap-2.5">
              <Swatch color={colorOf(r.c)} />
              <span className="min-w-0 flex-1 truncate text-sm">{nameOf(r.c)}</span>
              {/* a coluna "era" só existe quando há com o que comparar; quando existe, está em todas as linhas (regra 3) */}
              {k > 0 && (
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {Math.round(r.then * 100) === Math.round(r.now * 100) ? 'igual' : `era ${pct(r.then)}`}
                </span>
              )}
              <span className="w-10 shrink-0 text-right font-mono text-sm tabular-nums">{pct(r.now)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
