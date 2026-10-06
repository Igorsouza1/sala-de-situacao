'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { FonteTempo } from '@/types/map-linha-do-tempo'
import { indexAt, monthName, phrase, rangeOf, yearTicks, type Bar } from './helpers/timeline'

// O histograma da linha do tempo (DESIGN.md 13.9): uma barra por mês, na cor da fonte (tokens). Arrastar marca uma faixa de meses e clicar
// numa barra marca o mês; o filtro do mapa acompanha quando se solta (sem botão Aplicar, como o resto dos Filtros). A faixa fica
// destacada em verde claro e as barras de fora esmaecem. Passar o mouse diz o mês e a contagem, na mesma frase de baixo.
// A conta de pixel para barra é pura (`indexAt`); `touch-action: pan-y` deixa a rolagem vertical do painel funcionar no toque.

const WIDTH = 320
const HEIGHT = 96

const FILL: Record<FonteTempo, string> = { focos: 'fill-crit', desmatamento: 'fill-warn', acoes: 'fill-primary' }

interface TimelineChartProps {
  bars: Bar[]
  source: FonteTempo
  /** a faixa que o filtro de agora marca, ou nada */
  selection: [number, number] | null
  onSelect: (from: number, to: number) => void
}

export function TimelineChart({ bars, source, selection, onSelect }: TimelineChartProps) {
  const svg = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<{ anchor: number; current: number } | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  const step = WIDTH / bars.length
  const gap = step >= 4 ? 1 : step >= 2 ? 0.5 : 0
  const max = Math.max(...bars.map((b) => b.n), 1)
  const shown: [number, number] | null = drag ? rangeOf(drag.anchor, drag.current) : selection

  const at = (e: React.PointerEvent) => {
    const rect = svg.current!.getBoundingClientRect()
    return indexAt(e.clientX - rect.left, rect.width, bars.length)
  }
  const down = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const i = at(e)
    setDrag({ anchor: i, current: i })
  }
  const move = (e: React.PointerEvent) => {
    const i = at(e)
    if (drag) setDrag({ ...drag, current: i })
    else setHover(i)
  }
  const up = () => {
    if (!drag) return
    const [from, to] = rangeOf(drag.anchor, drag.current)
    setDrag(null)
    onSelect(from, to)
  }

  // a frase de baixo: o que se arrasta ou está marcado, senão o mês sob o mouse, senão a dica
  const line = shown
    ? phrase(bars, source, shown[0], shown[1])
    : hover !== null
      ? phrase(bars, source, hover, hover)
      : 'Arraste para escolher um período ou toque numa barra.'
  const hint = shown === null && hover === null

  return (
    <div className="select-none">
      <svg
        ref={svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Histograma por mês. ${line}`}
        className="block h-24 w-full cursor-pointer touch-pan-y overflow-visible"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => setDrag(null)}
        onPointerLeave={() => { if (!drag) setHover(null) }}
      >
        {/* a faixa escolhida: fundo verde claro atrás das barras */}
        {shown && <rect x={shown[0] * step} y={0} width={(shown[1] - shown[0] + 1) * step} height={HEIGHT} className="fill-secondary" rx={2} />}
        {/* o mês sob o mouse */}
        {hover !== null && !drag && <rect x={hover * step} y={0} width={step} height={HEIGHT} className="fill-muted" />}
        {bars.map((b, i) => {
          const h = b.n === 0 ? 0 : Math.max(2, (b.n / max) * (HEIGHT - 6))
          const inside = !shown || (i >= shown[0] && i <= shown[1])
          return <rect key={b.mes} x={i * step + gap / 2} y={HEIGHT - h} width={Math.max(step - gap, 0.5)} height={h} className={cn(FILL[source], 'transition-opacity duration-200', !inside && 'opacity-30')} />
        })}
        <line x1={0} x2={WIDTH} y1={HEIGHT - 0.5} y2={HEIGHT - 0.5} className="stroke-border" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>

      {/* o eixo: só os anos (as barras são meses, e 90 marcas de mês não se leem) */}
      <div className="relative mt-1 h-4" aria-hidden>
        {yearTicks(bars).map((t) => (
          <span key={t.year} className="absolute -translate-x-1/2 text-xs text-muted-foreground" style={{ left: `${((t.index + 0.5) / bars.length) * 100}%` }}>
            {t.year}
          </span>
        ))}
      </div>

      <p key={line} role="status" className={cn('animate-in fade-in-0 mt-3 text-sm leading-snug duration-200', hint && 'text-muted-foreground')}>
        {line}
      </p>
      {shown && drag === null && <p className="sr-only">{monthName(bars[shown[0]])}</p>}
    </div>
  )
}
