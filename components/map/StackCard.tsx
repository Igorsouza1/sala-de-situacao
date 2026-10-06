'use client'

import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ICON_STROKE, resolveLayerIcon } from './helpers/layer-icons'

// A lista de ações que estão exatamente no mesmo ponto do mapa (DESIGN.md 13.6). Passar o mouse mostra (só leitura); clicar deixa a
// lista aberta e as linhas passam a ser botões que abrem o registro no Explorar. Cada linha: ícone da área (o do mapa), nome e status
// (palavra e ponto, como no cartão da ação). Até 6 linhas; o resto fica numa frase. O rodapé diz o que o clique faz.

export interface StackEntry {
  key: string
  props: Record<string, any>
  name: string
  status?: string
  color: string
  iconName: string
  opacity: number
}

const MAX_ROWS = 6

export function StackCard({ entries, interactive, onPick }: { entries: StackEntry[]; interactive: boolean; onPick: (entry: StackEntry) => void }) {
  const shown = entries.slice(0, MAX_ROWS)
  const hidden = entries.length - shown.length
  return (
    <div className={cn('animate-hover-card w-[272px] select-none overflow-hidden rounded-lg border border-border bg-card shadow-control', !interactive && 'pointer-events-none')}>
      <div className="px-4 pb-1 pt-4">
        <h4 className="text-sm font-semibold leading-snug">{entries.length} ações neste ponto</h4>
      </div>
      <ul className="py-1">
        {shown.map((entry) => {
          const Icon = resolveLayerIcon(entry.iconName)
          const row = (
            <>
              <span aria-hidden style={{ backgroundColor: entry.color }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white">
                <Icon size={16} color="white" stroke={ICON_STROKE} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium leading-snug">{entry.name}</span>
                {entry.status && (
                  <span className="mt-0.5 flex items-center gap-2 text-xs leading-snug text-muted-foreground">
                    {entry.status}
                    <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  </span>
                )}
              </span>
            </>
          )
          return (
            <li key={entry.key}>
              {interactive ? (
                <button type="button" onClick={() => onPick(entry)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-200 hover:bg-muted focus-visible:bg-muted focus-visible:outline-hidden">
                  {row}
                </button>
              ) : (
                <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">{row}</div>
              )}
            </li>
          )
        })}
      </ul>
      {hidden > 0 && <p className="px-4 pb-2 text-xs text-muted-foreground">e mais {hidden} {hidden === 1 ? 'ação' : 'ações'}</p>}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {interactive ? 'Escolha uma para ver os detalhes' : 'Clique para escolher uma'}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </div>
    </div>
  )
}
