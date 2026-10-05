'use client'

import { ChevronDown, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BASEMAP_KEYS, BASEMAP_LABELS, type BasemapKey } from './helpers/basemaps'

interface BasemapControlProps {
  /** base escolhida pelo usuário */
  value: BasemapKey
  /** base que está de fato na tela (difere de `value` quando o Mineral não carregou) */
  shown: BasemapKey
  onChange: (key: BasemapKey) => void
}

export function BasemapControl({ value, shown, onChange }: BasemapControlProps) {
  const unavailable = value !== shown
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="group shadow-card">
            {/* camadas sobem no hover (8.1) e o chevron gira ao abrir */}
            <Layers className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
            {BASEMAP_LABELS[shown]}
            <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[1100] w-40">
          <DropdownMenuRadioGroup value={value}>
            {BASEMAP_KEYS.map((key) => (
              // onSelect (e não onValueChange): escolher o Mineral de novo, quando falhou, tenta outra vez
              <DropdownMenuRadioItem key={key} value={key} onSelect={() => onChange(key)}>
                {BASEMAP_LABELS[key]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {unavailable && (
        <p
          role="status"
          className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-card"
        >
          {BASEMAP_LABELS[value]} indisponível agora. Mostrando {BASEMAP_LABELS[shown]}.
        </p>
      )}
    </div>
  )
}
