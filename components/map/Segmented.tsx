'use client'

import { cn } from '@/lib/utils'
import { controlItem } from './helpers/control-style'

// Uma escolha entre poucas opções, todas à vista (DESIGN.md 6.2): a marcada em verde claro, setas movem a escolha (radiogroup).
interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const at = options.findIndex((o) => o.value === value)
    onChange(options[(at + step + options.length) % options.length].value)
  }
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border border-border bg-card p-1">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn('h-10 text-sm font-medium', controlItem(selected))}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
