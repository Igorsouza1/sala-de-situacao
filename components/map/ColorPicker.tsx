'use client'

import { useState, type KeyboardEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { HUES, TONES, describeColor, hueSwatch, nearestHue, nearestTone, tonesFor } from './helpers/color'

// "Outra cor" (DESIGN.md 13.3): no lugar do seletor do navegador, que abre com o visual do sistema e sem movimento (6.2, regra 6),
// um cartão da marca. A tela guia a escolha: primeiro a MATIZ, depois o TOM, e a cor vale na hora (o mapa já mostra). Sem arrastar
// um ponto num quadrado, sem digitar código. Abre a partir do botão, com a mola do projeto; os tons trocam de cor suavemente
// quando a matiz muda (8.1). Cada fileira é um grupo de opções: setas movem a escolha.

const tile = 'flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-foreground/25 transition-[scale,box-shadow] duration-200 ease-spring active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40'
const picked = 'ring-2 ring-primary ring-offset-2 ring-offset-card'

function arrow(e: KeyboardEvent, count: number, current: number, go: (n: number) => void) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const next = (current + dir + count) % count
  go(next)
  ;(e.currentTarget.children[next] as HTMLElement | undefined)?.focus()
}

export function OtherColor({ value, inPalette, onChange }: { value: string; inPalette: boolean; onChange: (hex: string) => void }) {
  const current = value.toLowerCase()
  const [open, setOpen] = useState(false)
  const [hue, setHue] = useState(() => nearestHue(value))
  const tones = tonesFor(hue)
  const toneIndex = tones.indexOf(current)
  const hueIndex = HUES.findIndex((x) => x.h === hue)

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setHue(nearestHue(value)) // abre já na família da cor atual
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Outra cor"
          title="Outra cor"
          className={cn(tile, 'relative', !inPalette && picked)}
          style={!inPalette ? { backgroundColor: value } : undefined}
        >
          {inPalette ? <Plus className="h-4 w-4 text-muted-foreground" aria-hidden /> : <Check className="h-4 w-4 text-background mix-blend-difference" aria-hidden />}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" sideOffset={10} className="popover-spring z-[1200] w-64 rounded-lg p-4 shadow-control">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold">Outra cor</h4>
          <span className="text-xs text-muted-foreground">{describeColor(current)}</span>
        </div>

        <div className="space-y-4">
          <div>
            <span className="mb-2 block text-xs text-muted-foreground">Cor</span>
            <div
              role="radiogroup"
              aria-label="Cor"
              onKeyDown={(e) => arrow(e, HUES.length, hueIndex, (n) => { setHue(HUES[n].h); onChange(tonesFor(HUES[n].h)[toneIndex >= 0 ? toneIndex : nearestTone(value)]) })}
              className="grid grid-cols-6 gap-2"
            >
              {HUES.map((x) => {
                const selected = x.h === hue
                return (
                  <button
                    key={x.h}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={x.name}
                    title={x.name}
                    tabIndex={selected ? 0 : -1}
                    // escolher a cor já aplica um tom, para a pessoa ver a mudança no mapa e só então afinar
                    onClick={() => { setHue(x.h); onChange(tonesFor(x.h)[toneIndex >= 0 ? toneIndex : nearestTone(value)]) }}
                    className={cn(tile, selected && picked)}
                    style={{ backgroundColor: hueSwatch(x.h) }}
                  />
                )
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs text-muted-foreground">Tom</span>
            <div
              role="radiogroup"
              aria-label="Tom"
              onKeyDown={(e) => arrow(e, TONES.length, toneIndex >= 0 ? toneIndex : nearestTone(value), (n) => onChange(tones[n]))}
              className="grid grid-cols-5 gap-2"
            >
              {TONES.map((t, i) => {
                const selected = i === toneIndex
                return (
                  <button
                    key={t.name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={t.name}
                    title={t.name}
                    tabIndex={selected || (toneIndex < 0 && i === nearestTone(value)) ? 0 : -1}
                    onClick={() => onChange(tones[i])}
                    // a cor do tom muda devagar quando a matiz muda: a pessoa vê a família "escorrer" em vez de trocar de uma vez
                    className={cn(tile, 'h-10 w-full transition-[background-color,scale,box-shadow] duration-300', selected && picked)}
                    style={{ backgroundColor: tones[i] }}
                  >
                    {selected && <Check className="h-4 w-4 text-background mix-blend-difference" aria-hidden />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
