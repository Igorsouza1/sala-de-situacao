'use client'

import * as LucideIcons from 'lucide-react'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { toPascalCase } from './helpers/map-visuals'

// Cartão do grupo de ações (DESIGN.md 13.4): o que tem dentro da bolha "25 ações", por área, sem ampliar o mapa. Cada linha é o
// ícone da área (o mesmo do marcador), o nome e quantas são; as áreas com mais ações vêm primeiro. Até 4 linhas, o resto vira
// "e mais N áreas" (6.3: poucas escolhas por cartão). O rodapé diz o que o clique faz.

export interface ClusterGroup {
  area: string
  count: number
  color: string
  iconName: string
}

const MAX_ROWS = 4

export function ClusterHoverCard({ count, groups }: { count: number; groups: ClusterGroup[] }) {
  const shown = groups.slice(0, MAX_ROWS)
  const hidden = groups.length - shown.length
  return (
    <div className="animate-hover-card pointer-events-none w-[272px] select-none overflow-hidden rounded-lg border border-border bg-card shadow-control">
      <div className="p-4">
        <h4 className="text-sm font-semibold leading-snug">{count} ações juntas</h4>
        <ul className="mt-3 space-y-2">
          {shown.map((g) => {
            const Icon: React.ElementType = (LucideIcons as any)[toPascalCase(g.iconName)] || MapPin
            return (
              <li key={g.area} className="flex items-center gap-3">
                <span aria-hidden style={{ backgroundColor: g.color }} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-white">
                  <Icon size={13} color="white" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{g.area}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{g.count}</span>
              </li>
            )
          })}
        </ul>
        {hidden > 0 && <p className="mt-2 text-xs text-muted-foreground">e mais {hidden} {hidden === 1 ? 'área' : 'áreas'}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        Clique para ampliar e separar
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </div>
    </div>
  )
}
