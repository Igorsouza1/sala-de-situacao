'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Escolha entre poucas opções em ladrilhos: cada um mostra **o resultado** (um desenho, um exemplo) acima do nome, para a pessoa
// entender sem clicar e sem ler (DESIGN.md regra 1, 2.1). O marcado fica em verde claro com borda de floresta, como as bases do mapa.
interface ChoiceTilesProps<T extends string> {
  label: string
  /** `null`: nenhum deste grupo está marcado (o marcado está em outro grupo) */
  value: T | null
  options: { value: T; label: string; /** o resultado, em miniatura */ preview: ReactNode; /** uma linha curta sob o nome */ hint?: string; /** o motivo de não estar disponível agora: a opção continua clicável e `onBlocked` diz o porquê (2.1) */ blocked?: string }[]
  onChange: (value: T) => void
  /** colunas; padrão: uma por opção */
  columns?: number
  onBlocked?: (reason: string) => void
}

export function ChoiceTiles<T extends string>({ label, value, options, onChange, columns, onBlocked }: ChoiceTilesProps<T>) {
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const free = options.filter((o) => !o.blocked)
    const at = free.findIndex((o) => o.value === value)
    onChange(free[(at + step + free.length) % free.length].value)
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o, i) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (value === null && i === 0) ? 0 : -1}
            aria-disabled={o.blocked ? true : undefined}
            onClick={() => (o.blocked ? onBlocked?.(o.blocked) : onChange(o.value))}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-md border p-2 text-center transition-[background-color,border-color,color,translate,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
              selected ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              o.blocked && 'opacity-50',
            )}
          >
            <span className="flex h-10 w-full items-center justify-center overflow-clip rounded-sm border border-border bg-card text-foreground" aria-hidden>{o.preview}</span>
            <span className={cn('text-sm leading-tight', selected ? 'font-semibold' : 'font-medium')}>{o.label}</span>
            {o.hint && <span className="text-xs leading-tight opacity-80">{o.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}
