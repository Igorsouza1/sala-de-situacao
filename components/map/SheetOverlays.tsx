'use client'

import '@/lib/maplibre-worker'
import Map, { Layer, Source } from 'react-map-gl/maplibre'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ColorSwatch, IconSwatch } from './MapLegend'
import { Legend } from './LayerManager'
import { buildGrid, edgeCrossing, type GridFormat } from './helpers/grid'
import type { LegendItem, LegendSection } from './helpers/legend-sheet'
import { paperScale, paperScaleBar, type PaperFrame } from './helpers/scale'
import { cornerAnchor, type Corner } from './helpers/sheet'

// O que a folha desenha por cima do mapa (Gerar mapa): seta do norte, barra de escala, grade com coordenadas, legenda, mapa de
// localização e texto livre. Os tamanhos vêm em milímetros do papel e `pxPerMm` os leva para a tela: o desenho é o mesmo da folha
// impressa, só em outra escala. Cada canto do mapa tem um elemento só (placeCorners), então nada encosta em nada.

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
const INSET_MM = 4 // folga entre o elemento e a borda do mapa

/** a posição em pixels de um elemento encostado num canto do mapa */
function anchor(corner: Corner, pxPerMm: number) {
  const a = cornerAnchor(corner, INSET_MM)
  return { top: a.top && a.top * pxPerMm, bottom: a.bottom && a.bottom * pxPerMm, left: a.left && a.left * pxPerMm, right: a.right && a.right * pxPerMm }
}

export function NorthArrow({ pxPerMm, corner }: { pxPerMm: number; corner: Corner }) {
  const mm = (v: number) => v * pxPerMm
  return (
    <div className={`${plate} flex flex-col items-center`} style={{ ...anchor(corner, pxPerMm), padding: mm(1.5), gap: mm(0.5) }} role="img" aria-label="Seta do norte">
      <span className="font-semibold leading-none text-foreground" style={{ fontSize: mm(3.2) }}>N</span>
      <svg width={mm(6)} height={mm(10)} viewBox="0 0 12 20" aria-hidden>
        <polygon points="6,0 12,20 6,15" fill={INK} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
        <polygon points="6,0 6,15 0,20" fill={HALO} stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export function ScaleBlock({ view, frame, pxPerMm, corner }: { view: MapView; frame: PaperFrame; pxPerMm: number; corner: Corner }) {
  const mm = (v: number) => v * pxPerMm
  const bar = paperScaleBar(view.lat, view.zoom, frame, 40)
  const { label } = paperScale(view.lat, view.zoom, frame)
  if (bar.ticks.length === 0) return null
  return (
    <div className={plate} style={{ ...anchor(corner, pxPerMm), padding: mm(1.5) }} role="img" aria-label={`Escala aproximada ${label}, barra de ${bar.ticks.at(-1)}`}>
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

// ── Legenda ───────────────────────────────────────────────────────────────────────────────────────────────────────
// A legenda é desenhada num tamanho fixo (as amostras do mapa têm 24 px) e a folha a escala: ela vale LEGEND_MM de largura no papel,
// seja qual for o papel ou a janela. A escala parte do canto onde ela está, para ficar encostada nele.
const LEGEND_DESIGN_W = 220
const LEGEND_MM = 62
const ORIGIN: Record<Corner, string> = { 'top-left': 'top left', 'top-right': 'top right', 'bottom-left': 'bottom left', 'bottom-right': 'bottom right' }

function Swatch({ item }: { item: LegendItem }) {
  const s = item.swatch
  if (s.kind === 'color') return <ColorSwatch color={s.color} />
  if (s.kind === 'icon') return <IconSwatch name={s.iconName} />
  return <Legend option={s.option} checked />
}

function LegendRow({ item, depth }: { item: LegendItem; depth: number }) {
  return (
    <>
      <li className="flex min-h-7 items-center gap-2" style={{ paddingLeft: depth * 16 }}>
        <Swatch item={item} />
        <span className="min-w-0 text-[12px] leading-snug text-foreground">{item.label}</span>
      </li>
      {item.children.map((c) => <LegendRow key={c.id} item={c} depth={depth + 1} />)}
    </>
  )
}

export function LegendBlock({ title, sections, corner, pxPerMm, mapHeightMm }: { title: string; sections: LegendSection[]; corner: Corner; pxPerMm: number; mapHeightMm: number }) {
  if (sections.length === 0) return null
  const k = (LEGEND_MM * pxPerMm) / LEGEND_DESIGN_W
  return (
    <div
      className={cn(plate, 'overflow-clip p-3')}
      style={{ ...anchor(corner, pxPerMm), width: LEGEND_DESIGN_W, maxHeight: ((mapHeightMm - INSET_MM * 2) * pxPerMm) / k, transform: `scale(${k})`, transformOrigin: ORIGIN[corner] }}
      role="group"
      aria-label={title || 'Legenda'}
    >
      {title.trim() && <p className="mb-1.5 text-[13px] font-semibold leading-tight text-foreground">{title}</p>}
      {sections.map((s) => (
        <div key={s.id} className="mt-1.5 first:mt-0">
          {s.title && <p className="mb-0.5 text-[11px] font-medium leading-tight text-muted-foreground">{s.title}</p>}
          <ul>{s.items.map((i) => <LegendRow key={i.id} item={i} depth={0} />)}</ul>
        </div>
      ))}
    </div>
  )
}

// ── Mapa de localização ───────────────────────────────────────────────────────────────────────────────────────────
// Um mapa pequeno, mais afastado, com um retângulo no lugar que a folha mostra: diz onde a área fica.
const INSET_W_MM = 40
const INSET_H_MM = 30
const INSET_ZOOM_OUT = 6 // a folha cabe umas dezenas de vezes dentro do mapa de localização

export function LocationInset({ style, view, center, pxPerMm, corner }: { style: any; view: MapView; center: { lng: number; lat: number }; pxPerMm: number; corner: Corner }) {
  const mm = (v: number) => v * pxPerMm
  const outline = useMemo(() => {
    const { west, south, east, north } = view.bounds
    return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] } }
  }, [view.bounds])
  const crit = typeof document === 'undefined' ? 'transparent' : getComputedStyle(document.documentElement).getPropertyValue('--color-crit').trim()
  return (
    <div className="absolute overflow-clip rounded-sm border border-foreground bg-muted shadow-control" style={{ ...anchor(corner, pxPerMm), width: mm(INSET_W_MM), height: mm(INSET_H_MM) }} role="img" aria-label="Mapa de localização">
      <Map
        mapStyle={style}
        longitude={center.lng}
        latitude={center.lat}
        zoom={Math.max(0, view.zoom - INSET_ZOOM_OUT)}
        interactive={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="folha" type="geojson" data={outline}>
          <Layer id="folha-linha" type="line" paint={{ 'line-color': crit, 'line-width': 2 }} />
        </Source>
      </Map>
    </div>
  )
}

// ── Texto livre ───────────────────────────────────────────────────────────────────────────────────────────────────
export function NoteBlock({ text, pxPerMm }: { text: string; pxPerMm: number }) {
  const mm = (v: number) => v * pxPerMm
  if (!text.trim()) return null
  return (
    <p className={`${plate} line-clamp-3 text-center text-foreground`} style={{ top: mm(INSET_MM), left: '50%', translate: '-50% 0', maxWidth: '34%', padding: mm(1.5), fontSize: mm(2.6) }}>
      {text}
    </p>
  )
}

// ── Grade ─────────────────────────────────────────────────────────────────────────────────────────────────────────
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
