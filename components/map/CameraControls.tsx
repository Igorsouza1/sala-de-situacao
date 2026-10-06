'use client'

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Frame, Minus, Navigation2, Plus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'
import type { ViewMode } from './helpers/view-mode'

// Câmera (DESIGN.md 13): zoom, bússola e 2D|3D num cartão só, no canto, com o mesmo estilo do dock.
// No celular o + e o − somem: o gesto de pinça já resolve, e a bússola e o 2D|3D continuam.
// O segmento 2D|3D segue a câmera (o pai atualiza `viewMode` quando ela chega) e funciona como radiogroup: setas movem a escolha.

const MODES: { value: ViewMode; label: string; hint: string }[] = [
  { value: '2d', label: '2D', hint: 'Ver de cima' },
  { value: '3d', label: '3D', hint: 'Ver inclinado' },
]

const itemClass = 'flex h-9 w-full items-center justify-center'
const touchHidden = '[@media(pointer:coarse)]:hidden'

function Tip({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="left">{hint}</TooltipContent>
    </Tooltip>
  )
}

const Divider = ({ className }: { className?: string }) => <div className={cn('mx-1.5 my-0.5 h-px bg-border', className)} />

interface CameraControlsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapRef: React.RefObject<any>
  /** o mapa já carregou: antes disso não há câmera para controlar */
  ready: boolean
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  /** a região já carregou: antes disso não há o que enquadrar */
  canFitRegion: boolean
  onFitRegion: () => void
}

export function CameraControls({ mapRef, ready, viewMode, onViewModeChange, canFitRegion, onFitRegion }: CameraControlsProps) {
  const [bearing, setBearing] = useState(0)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!ready || !map) return
    const sync = () => setBearing(map.getBearing())
    sync()
    map.on('rotate', sync)
    return () => { map.off('rotate', sync) }
  }, [mapRef, ready])

  const onModeKey = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = MODES.find((m) => m.value !== viewMode)!
    onViewModeChange(next.value)
    e.currentTarget.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus()
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('absolute right-4 top-4 z-[400] flex w-10 flex-col rounded-md p-0.5', controlSurface)}>
        <div className={cn('flex flex-col', touchHidden)}>
          <Tip hint="Aproximar (+)">
            <button type="button" aria-label="Aproximar" onClick={() => mapRef.current?.getMap().zoomIn()} className={cn(itemClass, controlItem())}>
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </Tip>
          <Tip hint="Afastar (−)">
            <button type="button" aria-label="Afastar" onClick={() => mapRef.current?.getMap().zoomOut()} className={cn(itemClass, controlItem())}>
              <Minus className="h-4 w-4" aria-hidden />
            </button>
          </Tip>
          <Divider />
        </div>

        {/* o mapa abre onde a pessoa deixou (13.2); este botão devolve a vista da região inteira. Bloqueado, diz por quê (2.1). */}
        <Tip hint={canFitRegion ? 'Enquadrar a região (Home)' : 'Disponível quando a região carregar'}>
          <button
            type="button"
            aria-label="Enquadrar a região"
            aria-disabled={!canFitRegion}
            onClick={() => canFitRegion && onFitRegion()}
            className={cn(itemClass, controlItem(), !canFitRegion && 'opacity-45 hover:bg-transparent')}
          >
            <Frame className="h-4 w-4" aria-hidden />
          </button>
        </Tip>

        <Tip hint="Norte para cima">
          <button type="button" aria-label="Voltar o norte para cima" onClick={() => mapRef.current?.getMap().resetNorthPitch()} className={cn(itemClass, controlItem())}>
            <Navigation2 className="h-4 w-4" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden />
          </button>
        </Tip>
        <Divider />

        <div role="radiogroup" aria-label="Ângulo do mapa" onKeyDown={onModeKey} className="flex flex-col">
          {MODES.map((m) => {
            const active = m.value === viewMode
            return (
              <Tip key={m.value} hint={m.hint}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={m.hint}
                  tabIndex={active ? 0 : -1}
                  data-value={m.value}
                  onClick={() => !active && onViewModeChange(m.value)}
                  className={cn(itemClass, 'font-mono text-xs font-semibold tabular-nums', controlItem(active))}
                >
                  {m.label}
                </button>
              </Tip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
