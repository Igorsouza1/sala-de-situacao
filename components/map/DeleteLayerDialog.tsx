'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertDialog as D } from 'radix-ui'
import { Check, ChevronsRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { slideDone, slideKey, slideProgress } from './helpers/slide-confirm'

// Excluir camada (DESIGN.md 13.1): as duas travas antes do aviso com desfazer. (1) A pergunta, com a saída segura em foco; (2) no mesmo
// cartão, arrastar um botão da esquerda para a direita. Exceção registrada à regra 13: é a única ação do mapa que apaga dado de todos
// sem volta, e um clique errado no menu do botão direito não pode bastar. Quem tem o mapa decide o que acontece depois (`onConfirm`).

export interface DeleteLayerTarget {
  slug: string
  label: string
}

type Step = 'ask' | 'slide'

export function DeleteLayerDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: DeleteLayerTarget | null
  onCancel: () => void
  onConfirm: (target: DeleteLayerTarget) => void
}) {
  const [step, setStep] = useState<Step>('ask')
  // o cartão sai com animação: até lá ele precisa do nome da camada
  const last = useRef(target)
  if (target) last.current = target
  const shown = target ?? last.current
  const open = !!target
  useEffect(() => { if (open) setStep('ask') }, [open, target?.slug])

  const knob = useRef<HTMLDivElement>(null)
  useEffect(() => { if (step === 'slide') knob.current?.focus() }, [step])

  if (!shown) return null

  return (
    <D.Root open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <D.Portal>
        <D.Overlay className="dialog-veil fixed inset-0 z-[1300] bg-foreground/25" />
        <div className="pointer-events-none fixed inset-0 z-[1300] grid place-items-center p-4">
          <D.Content className="dialog-spring pointer-events-auto w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-control">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-crit/10 text-crit" aria-hidden>
                <Trash2 className="h-5 w-5" />
              </span>
              {/* o texto troca em crossfade; o cartão e o ícone ficam (8.4) */}
              <D.Title key={step} className="min-w-0 flex-1 animate-in truncate text-base font-semibold leading-snug fade-in-0 duration-200">
                {step === 'ask' ? 'Tem certeza?' : 'Arraste para excluir'}
              </D.Title>
            </div>

            <D.Description key={`d-${step}`} className="mt-3 animate-in text-sm leading-relaxed text-muted-foreground fade-in-0 duration-200">
              {step === 'ask' ? (
                <>
                  Excluir <span className="font-medium text-foreground">“{shown.label}”</span> apaga a camada e tudo o que veio com ela, para
                  sempre e para todas as pessoas da região. Não será possível recuperar.
                </>
              ) : (
                <>
                  Última trava: leve o botão até o fim para excluir <span className="font-medium text-foreground">“{shown.label}”</span>. Depois,
                  ainda dá 10 segundos para desfazer.
                </>
              )}
            </D.Description>

            {step === 'ask' ? (
              <div key="ask" className="mt-8 flex animate-in justify-end gap-2 fade-in-0 duration-200">
                {/* o AlertDialog põe o foco no Cancelar ao abrir: a saída segura é a que está à mão */}
                <D.Cancel asChild>
                  <Button variant="outline">Cancelar</Button>
                </D.Cancel>
                <Button variant="destructive" onClick={() => setStep('slide')}>
                  Sim, excluir
                </Button>
              </div>
            ) : (
              <div key="slide" className="mt-6 animate-in fade-in-0 duration-200">
                <SlideToConfirm knobRef={knob} name={shown.label} onDone={() => onConfirm(shown)} />
                <div className="mt-6 flex justify-end">
                  <D.Cancel asChild>
                    <Button variant="outline">Cancelar</Button>
                  </D.Cancel>
                </div>
              </div>
            )}
          </D.Content>
        </div>
      </D.Portal>
    </D.Root>
  )
}

// A faixa: 56 px de altura, o botão redondo de 48 px a 4 px da borda. O caminho do botão é a largura da faixa menos 56 px.
const KNOB_SPACE = 56

function SlideToConfirm({ knobRef, name, onDone }: { knobRef: React.RefObject<HTMLDivElement | null>; name: string; onDone: () => void }) {
  const track = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(0)
  const pRef = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState(false)
  const start = useRef<{ x: number; p: number } | null>(null)

  const set = (v: number) => { pRef.current = v; setP(v) }
  const travel = () => (track.current?.clientWidth ?? 0) - KNOB_SPACE
  const finish = () => {
    if (done) return
    start.current = null
    setDragging(false)
    setDone(true)
    set(1)
    navigator.vibrate?.(12)
    // o check aparece e assenta antes de a janela sair
    setTimeout(onDone, 320)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (done || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, p: pRef.current }
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = start.current
    if (!s) return
    const t = travel()
    const next = slideProgress(s.p * t + e.clientX - s.x, t)
    set(next)
    if (next >= 1) finish()
  }
  const onPointerEnd = () => {
    if (!start.current) return
    start.current = null
    setDragging(false)
    // soltou antes do fim: o botão volta com a mola
    if (slideDone(pRef.current)) finish()
    else set(0)
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (done) return
    const next = slideKey(pRef.current, e.key)
    if (next === null) return
    e.preventDefault()
    set(next)
    if (next >= 1) finish()
  }

  const moving = dragging ? 'transition-none' : 'duration-[260ms] ease-spring'
  return (
    <div ref={track} className="relative h-14 select-none rounded-full bg-crit/10">
      {/* a faixa enche em terracota atrás do botão: o que já foi feito do caminho */}
      <div
        aria-hidden
        className={cn('absolute inset-y-0 left-0 rounded-full bg-crit/20 transition-[width]', moving)}
        style={{ width: `calc(${KNOB_SPACE}px + ${p} * (100% - ${KNOB_SPACE}px))` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center pl-12 text-sm font-medium text-crit transition-opacity duration-200"
        style={{ opacity: done ? 0 : Math.max(0, 1 - p * 1.6) }}
      >
        Arraste até o fim
      </span>
      <div
        ref={knobRef}
        role="slider"
        tabIndex={0}
        aria-label={`Arraste até o fim para excluir “${name}”`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100)}
        aria-valuetext={done ? 'Concluído' : `${Math.round(p * 100)} por cento do caminho`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        style={{ left: `calc(4px + ${p} * (100% - ${KNOB_SPACE}px))` }}
        className={cn(
          'absolute top-1 grid size-12 touch-none place-items-center rounded-full bg-crit text-white shadow-control outline-hidden transition-[left,scale,box-shadow] focus-visible:ring-[3px] focus-visible:ring-crit/35',
          moving,
          !done && 'hover:scale-105 active:scale-95',
        )}
      >
        {done ? (
          <Check key="done" className="h-5 w-5 animate-in zoom-in-50 duration-200" aria-hidden />
        ) : (
          <ChevronsRight className="h-5 w-5" aria-hidden />
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{done ? 'Concluído. Excluindo a camada.' : ''}</span>
    </div>
  )
}
