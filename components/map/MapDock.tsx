'use client'

import { createContext, forwardRef, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlItem, controlSurface } from './helpers/control-style'

// Dock do mapa (DESIGN.md 13): uma barra só, embaixo e centralizada, onde moram os grupos de funções (Camadas, Filtros…).
// Rótulo sempre visível: no celular não existe hover para o tooltip (11). Os painéis abrem para cima, a partir do botão
// que os abriu, um por vez, e não bloqueiam o mapa: fecham no X, no Esc ou ao abrir outro (8.4).

const DockContext = createContext<{ open: string | null; setOpen: (id: string | null) => void }>({ open: null, setOpen: () => {} })

export function MapDock({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <DockContext.Provider value={{ open, setOpen }}>
      {/* o invólucro não captura clique: o mapa continua arrastável ao lado do dock */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[1000] flex justify-center px-3">
        <nav aria-label="Ferramentas do mapa" className={cn('pointer-events-auto flex items-stretch gap-0.5 rounded-md p-1', controlSurface)}>
          {children}
        </nav>
      </div>
    </DockContext.Provider>
  )
}

export function DockDivider() {
  return <div role="separator" aria-orientation="vertical" className="mx-1 my-1.5 w-px bg-border" />
}

interface DockButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  label: string
  active?: boolean
  /** quantos filtros ou itens estão ligados: aparece como número no canto */
  badge?: number
  /** algo pede atenção dentro do painel (ponto âmbar no canto) */
  alert?: boolean
}

export const DockButton = forwardRef<HTMLButtonElement, DockButtonProps>(function DockButton({ icon: Icon, label, active, badge, alert, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn('relative flex min-w-16 flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium', controlItem(active), className)}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      {label}
      {!!badge && (
        <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-sm bg-primary px-1 font-mono text-[10px] font-semibold text-primary-foreground">
          {badge}
          <span className="sr-only"> ativo{badge > 1 ? 's' : ''}</span>
        </span>
      )}
      {alert && (
        <span className="absolute right-2.5 top-1.5 h-2 w-2 rounded-full bg-warn">
          <span className="sr-only">Pede atenção</span>
        </span>
      )}
    </button>
  )
})

// Botão do dock que abre um painel. O conteúdo fica montado mesmo fechado: os filtros guardam o que a pessoa escolheu.
export function DockPanelButton({ id, icon, label, badge, alert, children }: { id: string; icon: LucideIcon; label: string; badge?: number; alert?: boolean; children: ReactNode }) {
  const { open, setOpen } = useContext(DockContext)
  const isOpen = open === id
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const wasOpen = useRef(false)
  const panelId = useId()

  // Foco (2.1.2, regra 8): ao abrir, vai para o painel; ao fechar com o foco dentro dele, volta ao botão.
  // Se o foco já saiu (abriu outro painel), não o tiramos de lá.
  useEffect(() => {
    if (isOpen) panel.current?.focus()
    else if (wasOpen.current && panel.current?.contains(document.activeElement)) trigger.current?.focus()
    wasOpen.current = isOpen
  }, [isOpen])

  return (
    // no celular o painel ancora no dock inteiro (largura toda); a partir de sm, no próprio botão
    <div className="sm:relative">
      <DockButton
        ref={trigger}
        icon={icon}
        label={label}
        active={isOpen}
        badge={badge}
        alert={alert}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpen(isOpen ? null : id)}
      />
      <div
        id={panelId}
        ref={panel}
        role="dialog"
        aria-modal="false"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          'absolute z-10 max-h-[60vh] flex-col overflow-hidden rounded-lg outline-hidden',
          'bottom-full mb-3 max-sm:inset-x-3 sm:left-1/2 sm:w-80 sm:-translate-x-1/2',
          controlSurface,
          isOpen ? 'flex' : 'hidden',
        )}
      >
        <header className="flex items-center justify-between border-b border-border py-2 pl-4 pr-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <button
            type="button"
            aria-label={`Fechar ${label}`}
            onClick={() => setOpen(null)}
            className={cn('flex h-8 w-8 items-center justify-center', controlItem())}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
