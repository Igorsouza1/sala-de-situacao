'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { controlItem } from './helpers/control-style'

// Aviso do mapa (DESIGN.md 12 e 2.1): cartão branco com sombra, borda na cor do estado, X que funciona. Segue o modelo do laboratório:
// entra com mola (400 ms) e sai deslizando (190 ms). Quando há "Desfazer", um contador de 10 segundos mostra quanto tempo falta
// (anel que se esvazia com o número dentro), e ele PARA enquanto o mouse ou o foco estão no aviso: ninguém deve perder a chance de
// desfazer por estar lendo ou por usar o teclado (9, acessibilidade). Fica no alto e ao centro, onde o olho já está depois de salvar.

export interface NoticeData {
  /** muda a cada aviso novo: o conteúdo troca sem o cartão sair e voltar (8.4: só o texto muda) */
  id: number
  tone: 'success' | 'error'
  title: string
  body?: string
  /** com `undo`, o aviso conta os segundos e oferece o botão */
  undo?: { seconds: number; onUndo: () => void }
  /** sem `undo`: some sozinho depois disto (ms). Padrão: 5 s no sucesso e 9 s no erro. */
  autoCloseMs?: number
}

const TICK = 100
const RING = 2 * Math.PI * 15

export function Notice({ notice, onClose }: { notice: NoticeData | null; onClose: () => void }) {
  // `shown` guarda o último aviso enquanto o cartão sai: ele precisa de conteúdo para deslizar para fora
  const [shown, setShown] = useState<NoticeData | null>(notice)
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const total = notice ? (notice.undo ? notice.undo.seconds * 1000 : (notice.autoCloseMs ?? (notice.tone === 'error' ? 9000 : 5000))) : 0

  useEffect(() => {
    if (notice) {
      setShown(notice)
      setLeaving(false)
      setRemaining(total)
      return
    }
    if (!shown) return
    setLeaving(true)
    const t = setTimeout(() => { setShown(null); setLeaving(false) }, 190)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice])

  useEffect(() => {
    if (!notice || paused) return
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r - TICK <= 0) { clearInterval(t); setTimeout(() => closeRef.current(), 0); return 0 }
        return r - TICK
      })
    }, TICK)
    return () => clearInterval(t)
  }, [notice, paused])

  if (!shown) return null
  const n = shown
  const seconds = Math.ceil(remaining / 1000)
  const border = n.tone === 'error' ? 'border-crit/70' : 'border-ok/70'

  return (
    <div
      role={n.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn('pointer-events-auto w-full max-w-sm rounded-lg border bg-card p-4 shadow-control', border, leaving ? 'animate-notice-out' : 'animate-notice-in')}
    >
      <div key={n.id} className="flex animate-in items-center gap-3 fade-in-0 duration-200">
        {n.undo ? (
          // o contador: um anel que se esvazia e o número dentro; o leitor de tela ouve a frase, não cada tique
          <span className="relative grid size-9 shrink-0 place-items-center" aria-hidden>
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-border" />
              <circle
                cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-ok"
                strokeDasharray={RING} strokeDashoffset={RING * (1 - remaining / total)} style={{ transition: `stroke-dashoffset ${TICK}ms linear` }}
              />
            </svg>
            <span className="font-mono text-sm font-semibold tabular-nums">{seconds}</span>
          </span>
        ) : (
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', n.tone === 'error' ? 'bg-crit/10 text-crit' : 'bg-ok/10 text-ok')} aria-hidden>
            {n.tone === 'error' ? <TriangleAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{n.title}</p>
          {n.body && <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{n.body}</p>}
          {n.undo && <p className="sr-only">Dá para desfazer por mais {seconds} segundos.</p>}
        </div>

        <div className="-mr-1 flex shrink-0 items-center gap-1">
          {n.undo && (
            <Button variant="secondary" size="sm" className="h-8" onClick={n.undo.onUndo}>
              Desfazer
            </Button>
          )}
          <button type="button" aria-label="Fechar o aviso" onClick={onClose} className={cn('flex h-8 w-8 items-center justify-center', controlItem())}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
