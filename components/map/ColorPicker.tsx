'use client'

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Check, Plus } from 'lucide-react'
import { Collapse } from '@/components/ui/collapse'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { HUES, TONES, describeColor, hexToHsv, hsvToHex, hueSwatch, nearestHue, nearestTone, parseHex, tonesFor } from './helpers/color'
import { controlItem } from './helpers/control-style'

// "Outra cor" (DESIGN.md 13.3): no lugar do seletor do navegador, que abre com o visual do sistema e sem movimento (6.2, regra 6),
// um cartão da marca com DOIS modos. **Cores** (o padrão) guia a escolha: primeiro a matiz, depois o tom, sem arrastar nada.
// **Livre** serve para qualquer cor: um quadrado de saturação e brilho, uma faixa de matiz e, se a pessoa já tem o código, o código.
// A cor vale na hora (o mapa já mostra). Abre a partir do botão com a mola do projeto; trocar de modo anima a altura (8.4).

const tile = 'flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-foreground/25 transition-[scale,box-shadow] duration-200 ease-spring active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40'
const picked = 'ring-2 ring-primary ring-offset-2 ring-offset-card'
const thumb = 'pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background shadow-control ring-1 ring-foreground/40'

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n))

function arrow(e: KeyboardEvent, count: number, current: number, go: (n: number) => void) {
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
  if (!dir) return
  e.preventDefault()
  const next = (current + dir + count) % count
  go(next)
  ;(e.currentTarget.children[next] as HTMLElement | undefined)?.focus()
}

type Hsv = { h: number; s: number; v: number }

// O quadrado: saturação para a direita, brilho para cima. Arrastar com o mouse ou o dedo, ou usar as setas (Shift anda mais).
function SaturationArea({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect()
    onChange({ ...hsv, s: clamp((e.clientX - r.left) / r.width) * 100, v: (1 - clamp((e.clientY - r.top) / r.height)) * 100 })
  }
  const step = (e: KeyboardEvent) => (e.shiftKey ? 10 : 2)
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Saturação e brilho"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.s)}
      aria-valuetext={`Saturação ${Math.round(hsv.s)}%, brilho ${Math.round(hsv.v)}%`}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
      onPointerMove={(e) => { if (e.buttons === 1) move(e) }}
      onKeyDown={(e) => {
        const d = step(e)
        if (e.key === 'ArrowRight') onChange({ ...hsv, s: clamp(hsv.s + d, 0, 100) })
        else if (e.key === 'ArrowLeft') onChange({ ...hsv, s: clamp(hsv.s - d, 0, 100) })
        else if (e.key === 'ArrowUp') onChange({ ...hsv, v: clamp(hsv.v + d, 0, 100) })
        else if (e.key === 'ArrowDown') onChange({ ...hsv, v: clamp(hsv.v - d, 0, 100) })
        else return
        e.preventDefault()
      }}
      className="relative h-36 w-full cursor-crosshair touch-none rounded-md ring-1 ring-foreground/25 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40"
      style={{ background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${hsv.h} 100% 50%))` }}
    >
      <span className={thumb} style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%`, backgroundColor: hsvToHex(hsv.h, hsv.s, hsv.v) }} />
    </div>
  )
}

const HUE_STRIP = `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `hsl(${h} 100% 50%)`).join(', ')})`

function HueStrip({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect()
    onChange({ ...hsv, h: clamp((e.clientX - r.left) / r.width) * 360 })
  }
  return (
    // o recuo lateral deixa a bolinha inteira dentro do cartão quando a matiz está numa ponta
    <div className="px-2">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="Matiz"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e) }}
        onPointerMove={(e) => { if (e.buttons === 1) move(e) }}
        onKeyDown={(e) => {
          const d = e.shiftKey ? 30 : 6
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange({ ...hsv, h: (hsv.h + d) % 360 })
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange({ ...hsv, h: (hsv.h - d + 360) % 360 })
          else return
          e.preventDefault()
        }}
        className="relative h-4 cursor-pointer touch-none rounded-full ring-1 ring-foreground/25 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40"
        style={{ background: HUE_STRIP }}
      >
        <span className={cn(thumb, 'top-1/2 size-5')} style={{ left: `${(hsv.h / 360) * 100}%`, backgroundColor: `hsl(${hsv.h} 100% 50%)` }} />
      </div>
    </div>
  )
}

type Mode = 'cores' | 'livre'
const MODES: { id: Mode; label: string }[] = [
  { id: 'cores', label: 'Cores' },
  { id: 'livre', label: 'Livre' },
]

export function OtherColor({ value, inPalette, onChange }: { value: string; inPalette: boolean; onChange: (hex: string) => void }) {
  const current = value.toLowerCase()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('cores')
  const [hue, setHue] = useState(() => nearestHue(value))
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value))
  const [code, setCode] = useState('')
  const [badCode, setBadCode] = useState(false)

  const tones = tonesFor(hue)
  const toneIndex = tones.indexOf(current)
  const hueIndex = HUES.findIndex((x) => x.h === hue)
  const toneNow = toneIndex >= 0 ? toneIndex : nearestTone(value)

  // no modo Livre o rascunho em HSV é o dono da cor (guarda a matiz mesmo quando a saturação zera); o código acompanha
  const applyHsv = (next: Hsv) => {
    setHsv(next)
    const hex = hsvToHex(next.h, next.s, next.v)
    setCode(hex.slice(1))
    setBadCode(false)
    onChange(hex)
  }

  const goMode = (m: Mode) => {
    setMode(m)
    if (m === 'livre') { setHsv(hexToHsv(value)); setCode(current.slice(1)); setBadCode(false) }
    else setHue(nearestHue(value))
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) { setMode('cores'); setHue(nearestHue(value)) } // o padrão é o guiado; "Livre" é um passo à parte
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

      <PopoverContent align="start" sideOffset={10} className="popover-spring z-[1200] w-72 rounded-lg p-4 shadow-control">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold">Outra cor</h4>
          <span className="text-xs text-muted-foreground">{describeColor(current)}</span>
        </div>

        {/* Cores | Livre: o mesmo segmento do 2D | 3D e das escolhas do editor */}
        <div
          role="radiogroup"
          aria-label="Como escolher a cor"
          onKeyDown={(e) => arrow(e, MODES.length, mode === 'cores' ? 0 : 1, (n) => goMode(MODES[n].id))}
          className="mb-3 flex gap-0.5 rounded-md border border-input bg-card p-0.5"
        >
          {MODES.map((m) => {
            const selected = m.id === mode
            return (
              <button key={m.id} type="button" role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} onClick={() => !selected && goMode(m.id)} className={cn('h-8 flex-1 px-2 text-xs font-medium', controlItem(selected))}>
                {m.label}
              </button>
            )
          })}
        </div>

        {/* os dois modos ficam montados e a altura passa de um para o outro (320 ms): sem salto (8.4) */}
        <Collapse open={mode === 'cores'}>
          <div className="space-y-4 p-1">
            <div>
              <span className="mb-2 block text-xs text-muted-foreground">Cor</span>
              <div
                role="radiogroup"
                aria-label="Cor"
                onKeyDown={(e) => arrow(e, HUES.length, hueIndex, (n) => { setHue(HUES[n].h); onChange(tonesFor(HUES[n].h)[toneNow]) })}
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
                      onClick={() => { setHue(x.h); onChange(tonesFor(x.h)[toneNow]) }}
                      className={cn(tile, 'w-full', selected && picked)}
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
                onKeyDown={(e) => arrow(e, TONES.length, toneNow, (n) => onChange(tones[n]))}
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
                      tabIndex={selected || (toneIndex < 0 && i === toneNow) ? 0 : -1}
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
        </Collapse>

        <Collapse open={mode === 'livre'}>
          {/* mais folga: a bolinha do quadrado passa metade para fora da borda quando a cor está num canto */}
          <div className="space-y-4 p-2">
            <SaturationArea hsv={hsv} onChange={applyHsv} />
            <HueStrip hsv={hsv} onChange={applyHsv} />
            <label className="block">
              <span className="mb-1.5 block text-xs text-muted-foreground">Já tem o código da cor?</span>
              <div className="flex items-center gap-2">
                <span className="size-9 shrink-0 rounded-md ring-1 ring-foreground/25 transition-colors duration-200" style={{ backgroundColor: value }} aria-hidden />
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground" aria-hidden>#</span>
                  <Input
                    value={code}
                    maxLength={7}
                    spellCheck={false}
                    autoComplete="off"
                    placeholder="2a7da6"
                    aria-label="Código da cor"
                    aria-invalid={badCode}
                    onChange={(e) => {
                      const text = e.target.value
                      setCode(text)
                      const hex = parseHex(text)
                      if (hex) { setBadCode(false); setHsv(hexToHsv(hex)); onChange(hex) }
                    }}
                    onBlur={() => setBadCode(code.trim() !== '' && !parseHex(code))}
                    className="h-9 pl-7 font-mono text-sm"
                  />
                </div>
              </div>
              {badCode && <p role="alert" className="mt-1.5 text-xs text-crit">Esse código não vale. Use 3 ou 6 letras e números, como 2a7da6.</p>}
            </label>
          </div>
        </Collapse>
      </PopoverContent>
    </Popover>
  )
}
