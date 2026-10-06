'use client'

import { buildGrid, edgeCrossing, type GridFormat } from './helpers/grid'
import { paperScale, paperScaleBar, type PaperFrame } from './helpers/scale'

// O que a folha desenha por cima do mapa (Gerar mapa): seta do norte, barra de escala e grade com coordenadas. Os tamanhos vêm em
// milímetros do papel e `pxPerMm` os leva para a tela: o desenho é o mesmo da folha impressa, só em outra escala.

export interface MapView {
  lat: number
  zoom: number
  bounds: { west: number; south: number; east: number; north: number }
}

interface Frame { w: number; h: number }

// o fio claro por fora garante que o traço e o texto apareçam sobre satélite e sobre base clara (6.2, regra 5)
const HALO = 'var(--color-card)'
const INK = 'var(--color-foreground)'
const textStyle = { paintOrder: 'stroke', stroke: HALO, strokeLinejoin: 'round' } as const

const plate = 'absolute rounded-sm bg-card/85 shadow-control'

export function NorthArrow({ pxPerMm }: { pxPerMm: number }) {
  const mm = (v: number) => v * pxPerMm
  return (
    <div className={`${plate} flex flex-col items-center`} style={{ right: mm(4), top: mm(4), padding: mm(1.5), gap: mm(0.5) }} role="img" aria-label="Seta do norte">
      <span className="font-semibold leading-none text-foreground" style={{ fontSize: mm(3.2) }}>N</span>
      <svg width={mm(6)} height={mm(10)} viewBox="0 0 12 20" aria-hidden>
        <polygon points="6,0 12,20 6,15" fill={INK} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
        <polygon points="6,0 6,15 0,20" fill={HALO} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function ScaleBlock({ view, frame, pxPerMm }: { view: MapView; frame: PaperFrame; pxPerMm: number }) {
  const mm = (v: number) => v * pxPerMm
  const bar = paperScaleBar(view.lat, view.zoom, frame, 40)
  const { label } = paperScale(view.lat, view.zoom, frame)
  if (bar.ticks.length === 0) return null
  return (
    <div className={plate} style={{ left: mm(4), bottom: mm(4), padding: mm(1.5) }} role="img" aria-label={`Escala aproximada ${label}, barra de ${bar.ticks.at(-1)}`}>
      <p className="leading-none text-foreground" style={{ fontSize: mm(2.4), marginBottom: mm(1) }}>Escala aprox. {label}</p>
      <div className="relative" style={{ width: mm(bar.widthMm), height: mm(1.6), border: `${Math.max(1, mm(0.2))}px solid ${INK}` }}>
        <div className="absolute inset-y-0 left-0 bg-foreground" style={{ width: '50%' }} />
      </div>
      <div className="relative flex justify-between leading-none text-foreground" style={{ width: mm(bar.widthMm), fontSize: mm(2.2), marginTop: mm(0.8) }}>
        <span>{bar.ticks[0]}</span>
        <span>{bar.ticks[1]}</span>
        <span>{bar.ticks[2]}</span>
      </div>
    </div>
  )
}

export function GridOverlay({ map, view, format, frame, pxPerMm }: { map: any; view: MapView; format: GridFormat; frame: Frame; pxPerMm: number }) {
  const mm = (v: number) => v * pxPerMm
  const grid = buildGrid(view.bounds, format)
  const font = mm(2.4)
  const edge = mm(1)

  const lines = grid.lines.map((line) => ({
    ...line,
    screen: line.points.map(([lng, lat]) => {
      const p = map.project([lng, lat])
      return { x: p.x as number, y: p.y as number }
    }),
  }))

  return (
    <svg className="pointer-events-none absolute inset-0" width={frame.w} height={frame.h} viewBox={`0 0 ${frame.w} ${frame.h}`} aria-hidden>
      {lines.map((l, i) => {
        const d = l.screen.map((p, j) => `${j ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
        return (
          <g key={`${l.axis}-${l.label}-${i}`}>
            <path d={d} fill="none" stroke={HALO} strokeOpacity={0.6} strokeWidth={mm(0.55)} />
            <path d={d} fill="none" stroke={INK} strokeOpacity={0.7} strokeWidth={mm(0.18)} />
          </g>
        )
      })}
      {lines.map((l, i) => {
        const key = `t-${l.axis}-${l.label}-${i}`
        if (l.axis === 'meridian') {
          const top = edgeCrossing(l.screen, 'y', 0)
          const bottom = edgeCrossing(l.screen, 'y', frame.h)
          return (
            <g key={key} fontSize={font} fill={INK} textAnchor="middle" style={{ ...textStyle, strokeWidth: mm(0.6) }}>
              {top !== null && top > mm(6) && top < frame.w - mm(6) && <text x={top} y={font + edge}>{l.label}</text>}
              {bottom !== null && bottom > mm(6) && bottom < frame.w - mm(6) && <text x={bottom} y={frame.h - edge}>{l.label}</text>}
            </g>
          )
        }
        const left = edgeCrossing(l.screen, 'x', 0)
        const right = edgeCrossing(l.screen, 'x', frame.w)
        return (
          <g key={key} fontSize={font} fill={INK} style={{ ...textStyle, strokeWidth: mm(0.6) }}>
            {left !== null && left > font && left < frame.h - font && <text x={edge} y={left - edge / 2} textAnchor="start">{l.label}</text>}
            {right !== null && right > font && right < frame.h - font && <text x={frame.w - edge} y={right - edge / 2} textAnchor="end">{l.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}
