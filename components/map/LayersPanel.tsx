'use client'

import { useEffect, useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BASEMAP_KEYS, BASEMAP_LABELS, type BasemapKey } from './helpers/basemaps'
import { controlItem } from './helpers/control-style'
import { LayerManager } from './LayerManager'
import { PanelCard } from './PanelCard'

// Painel Camadas (DESIGN.md 13.1): o mapa base primeiro (é a camada de baixo), depois um cartão por categoria de dados.
// O "Atualizar" fica no cabeçalho do painel, porque vale para todas as camadas e não para um cartão só.

// Miniaturas feitas só de tokens: lembram a base sem baixar imagem nenhuma.
const SWATCH: Record<BasemapKey, string> = {
  mineral: 'linear-gradient(135deg, var(--color-map-grass) 0 55%, var(--color-map-water) 55%)',
  'satellite-soft': 'linear-gradient(135deg, color-mix(in oklab, var(--color-muted-foreground) 45%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-muted-foreground) 55%, var(--color-water)) 55%)',
  satellite: 'linear-gradient(135deg, color-mix(in oklab, var(--color-foreground) 60%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-foreground) 55%, var(--color-water)) 55%)',
  streets: 'linear-gradient(135deg, var(--color-background) 0 55%, var(--color-border) 55%)',
  osm: 'linear-gradient(135deg, var(--color-map-urban) 0 55%, var(--color-map-grass) 55%)',
}

// O rótulo muda no próprio botão (8.4): Atualizar → Atualizando… → Atualizado.
export function RefreshButton({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  const [clicked, setClicked] = useState(false)
  const [done, setDone] = useState(false)
  useEffect(() => {
    if (!clicked || refreshing) return
    setClicked(false)
    setDone(true)
    const t = setTimeout(() => setDone(false), 2500)
    return () => clearTimeout(t)
  }, [clicked, refreshing])

  return (
    <button
      type="button"
      aria-disabled={refreshing}
      onClick={() => { if (refreshing) return; setClicked(true); onRefresh() }}
      className={cn('flex h-8 items-center gap-1.5 px-2.5 text-xs font-medium aria-disabled:opacity-45 aria-disabled:hover:bg-transparent', controlItem())}
    >
      {done ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden />}
      <span aria-live="polite">{refreshing ? 'Atualizando…' : done ? 'Atualizado' : 'Atualizar'}</span>
    </button>
  )
}

type LayerManagerProps = React.ComponentProps<typeof LayerManager>

interface LayersPanelProps extends LayerManagerProps {
  /** base escolhida pelo usuário */
  basemap: BasemapKey
  /** base que está de fato na tela (difere da escolhida quando o Mineral não carregou) */
  shownBasemap: BasemapKey
  onBasemapChange: (key: BasemapKey) => void
}

export function LayersPanel({ basemap, shownBasemap, onBasemapChange, ...layerProps }: LayersPanelProps) {
  const unavailable = basemap !== shownBasemap
  return (
    <div className="panel-rise space-y-4">
      <PanelCard title="Mapa base">
        <div role="radiogroup" aria-label="Mapa base" className="grid grid-cols-3 gap-2.5">
          {BASEMAP_KEYS.map((key) => {
            const selected = key === shownBasemap
            return (
              // clicar no Mineral de novo, depois de falhar, tenta outra vez: por isso não bloqueamos o já escolhido
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onBasemapChange(key)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-md border p-2 text-xs transition-[background-color,border-color,color,translate,scale] duration-200 ease-spring active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
                  selected ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="h-9 w-full rounded-sm border border-border" style={{ background: SWATCH[key] }} aria-hidden />
                {BASEMAP_LABELS[key]}
              </button>
            )
          })}
        </div>
        {unavailable && (
          <p role="status" className="mt-3 text-xs text-muted-foreground">
            {BASEMAP_LABELS[basemap]} indisponível agora. Mostrando {BASEMAP_LABELS[shownBasemap]}.
          </p>
        )}
      </PanelCard>

      <LayerManager {...layerProps} />
    </div>
  )
}
