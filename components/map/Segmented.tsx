'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { controlItem } from './helpers/control-style'

// Uma escolha entre poucas opções, todas à vista (DESIGN.md 6.2): a marcada em verde claro, setas movem a escolha (radiogroup).
interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: ReactNode; disabled?: boolean; /** o motivo de não estar disponível agora: a opção continua clicável e `onBlocked` diz o porquê (2.1) */ blocked?: string }[]
  onChange: (value: T) => void
  /** desligado, a tela diz o porquê perto dele (2.1): nunca só esmaecido */
  disabled?: boolean
  onBlocked?: (reason: string) => void
}

export function Segmented<T extends string>({ label, value, options, onChange, disabled, onBlocked }: SegmentedProps<T>) {
  const onKey = (e: React.KeyboardEvent) => {
    if (disabled) return
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const on = options.filter((o) => !o.disabled && !o.blocked)
    const at = on.findIndex((o) => o.value === value)
    onChange(on[(at + step + on.length) % on.length].value)
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} aria-disabled={disabled} className={cn('grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-border bg-card p-1 transition-opacity duration-300', disabled && 'opacity-50')}>
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled || o.disabled}
            tabIndex={selected ? 0 : -1}
            aria-disabled={o.blocked ? true : undefined}
            onClick={() => (o.blocked ? onBlocked?.(o.blocked) : onChange(o.value))}
            className={cn('h-10 text-sm font-medium', controlItem(selected), o.disabled && 'cursor-not-allowed opacity-50', o.blocked && 'opacity-50')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
