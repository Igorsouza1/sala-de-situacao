import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Cartão de um assunto dentro de um painel do mapa (DESIGN.md 6.2): o painel tem base em cinza suave e cada assunto mora
// num cartão branco com título. Assim se vê onde um assunto começa e onde termina sem ler, e nada fica "tudo branco".
// Opcionais, para quem tem um estado a dizer (Filtros): o ícone dá o assunto de relance e `active` pinta o ícone de verde e
// põe "Ligado" à direita, para ver sem ler quais cartões estão mexendo no mapa (regra 7: o estado é dito em cor e em frase).
interface PanelCardProps {
  title: string
  caption?: ReactNode
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  active?: boolean
  children: ReactNode
}

export function PanelCard({ title, caption, icon: Icon, active, children }: PanelCardProps) {
  const head = (
    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-semibold">{title}</h4>
      {caption && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{caption}</p>}
    </div>
  )
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      {Icon ? (
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-300',
              active ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          {head}
          {active !== undefined && (
            <span
              className={cn(
                'shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium transition-[opacity,background-color,color] duration-300',
                active ? 'bg-secondary text-secondary-foreground opacity-100' : 'opacity-0',
              )}
              aria-hidden={!active}
            >
              Ligado
            </span>
          )}
        </div>
      ) : (
        head
      )}
      <div className="mt-3">{children}</div>
    </section>
  )
}
