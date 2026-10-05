'use client'

import type { KeyboardEvent } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ViewMode } from './helpers/view-mode'

// Dois segmentos em vez de um botão de ícone: o usuário vê o estado atual sem pensar (DESIGN.md 2). O destaque troca no mesmo
// instante em que a câmera começa a mover (8.4), e a câmera continua mandando: o pai atualiza `value` quando ela chega.
const OPTIONS: { value: ViewMode; label: string; hint: string }[] = [
  { value: '2d', label: '2D', hint: 'Ver de cima' },
  { value: '3d', label: '3D', hint: 'Ver inclinado' },
]

interface MapViewModeControlProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function MapViewModeControl({ value, onChange }: MapViewModeControlProps) {
  // radiogroup: setas movem a escolha; só o segmento ativo entra na ordem do Tab
  const onKeyDown = (e: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
    e.preventDefault()
    const next = OPTIONS.find((o) => o.value !== value)!
    onChange(next.value)
    e.currentTarget.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus()
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="radiogroup"
        aria-label="Ângulo do mapa"
        onKeyDown={onKeyDown}
        className="flex h-9 items-center gap-0.5 rounded-md border border-input bg-card p-0.5 shadow-card"
      >
        {OPTIONS.map((o) => {
          const active = o.value === value
          return (
            <Tooltip key={o.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={o.hint}
                  tabIndex={active ? 0 : -1}
                  data-value={o.value}
                  onClick={() => !active && onChange(o.value)}
                  className={cn(
                    'h-full rounded-sm px-3 font-mono text-xs font-semibold tabular-nums transition-[background-color,color,transform] duration-180 ease-out',
                    'focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30 active:scale-[0.96]',
                    active ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {o.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{o.hint}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
