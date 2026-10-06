'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight, X } from 'lucide-react'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'
import { sinceText, type NewsItem } from './helpers/novidades'
import { Legend, type LayerManagerOption } from './LayerManager'
import { PanelCard } from './PanelCard'

// O sino de novidades (DESIGN.md 13.8): a primeira resposta do mapa, "o que mudou desde que eu estive aqui?". Fica no canto de cima à
// esquerda, onde não há mais nada. Sem novidade é um sino neutro; com novidade fica em verde cheio, com o número, e BALANÇA UMA VEZ
// quando a novidade chega (nunca em loop: 8.2). Clicar abre a lista, que abre para baixo na anatomia dos painéis. Abrir a lista marca
// como visto; cada item leva ao mapa (liga a camada, enquadra e destaca só os novos).

interface NewsBellProps {
  items: NewsItem[]
  unread: number
  since: string | null
  /** as camadas, para a amostra de cada item ser a mesma da legenda */
  options: LayerManagerOption[]
  onOpen: () => void
  onClose: () => void
  onShow: (item: NewsItem) => void
  /** outro painel do canto esquerdo (o Explorar) abriu: a lista de novidades sai da frente, os dois ocupariam o mesmo lugar */
  yield?: boolean
}

export function NewsBell({ items, unread, since, options, onOpen, onClose, onShow, yield: yielded }: NewsBellProps) {
  const [open, setOpen] = useState(false)
  const [ring, setRing] = useState(0)
  const previous = useRef(0)

  // balança uma vez quando chega novidade nova (o número sobe); abrir a lista zera o número e não balança
  useEffect(() => {
    if (unread > previous.current) setRing((n) => n + 1)
    previous.current = unread
  }, [unread])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => { if (yielded && open) close() }, [yielded]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (open) return close()
    setOpen(true)
    onOpen()
  }
  function close() {
    setOpen(false)
    onClose()
  }

  const when = sinceText(since)
  const sample = (slug: string) => options.find((o) => o.slug === slug)
  const label = unread > 0 ? `Novidades: ${unread} desde a última visita` : 'Novidades: nada de novo'

  return (
    <div className="absolute left-4 top-4 z-[400]">
      <button
        type="button"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={toggle}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center transition-[background-color,color,translate,scale] duration-300 ease-spring hover:-translate-y-px',
          controlSurface,
          'rounded-md',
          unread > 0 ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover' : controlItem(open),
        )}
      >
        {/* o balanço acontece uma vez: o key refaz o ícone quando chega novidade nova, e a animação roda e para */}
        <Bell key={ring} className={cn('h-[18px] w-[18px]', ring > 0 && unread > 0 && 'animate-bell-ring')} aria-hidden />
        {unread > 0 && (
          <span key={unread} className="animate-pop absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-card px-1 text-xs font-semibold text-foreground ring-2 ring-primary">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      <div
        role="dialog"
        aria-modal="false"
        aria-label="Novidades"
        inert={!open}
        className={cn(
          'absolute left-0 top-full mt-3 flex max-h-[calc(100svh-9rem)] w-[22rem] max-w-[calc(100vw-2rem)] origin-top-left flex-col overflow-hidden rounded-lg',
          'transition-[opacity,translate,scale,visibility]',
          controlSurface,
          open ? 'visible scale-100 opacity-100 duration-[240ms] ease-spring' : 'invisible -translate-y-2 scale-95 opacity-0 duration-150 ease-in',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border py-2.5 pl-5 pr-3">
          <h3 className="whitespace-nowrap text-base font-semibold">Novidades</h3>
          <button type="button" aria-label="Fechar Novidades" onClick={close} className={cn('flex h-8 w-8 items-center justify-center', controlItem())}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <OverlayScroll className="bg-muted/50 p-4">
          {items.length > 0 ? (
            <PanelCard title={when ? `Desde ${when}` : 'Desde a sua última visita'} caption="Toque num item para ver onde ele está no mapa.">
              <ul className="-mx-2">
                {items.map((item) => {
                  const option = sample(item.slug)
                  return (
                    <li key={item.kind}>
                      <button
                        type="button"
                        onClick={() => onShow(item)}
                        className="group flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-left transition-[background-color,scale] duration-200 ease-spring hover:bg-muted active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
                      >
                        {option ? <Legend option={option} checked /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
                        <span className="min-w-0 flex-1 text-sm leading-snug">{item.phrase}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-[translate] duration-200 ease-spring group-hover:translate-x-0.5" aria-hidden />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </PanelCard>
          ) : (
            <PanelCard title="Tudo em dia">
              <p className="text-sm leading-snug text-muted-foreground">{when ? `Nada de novo desde ${when}.` : 'Nada de novo desde a sua última visita.'}</p>
            </PanelCard>
          )}
        </OverlayScroll>
      </div>
    </div>
  )
}
