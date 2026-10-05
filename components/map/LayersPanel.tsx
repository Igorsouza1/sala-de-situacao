'use client'

import { useEffect, useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BASEMAP_KEYS, BASEMAP_LABELS, type BasemapKey } from './helpers/basemaps'
import { LayerManager } from './LayerManager'

// Painel Camadas (DESIGN.md 13): o mapa base em cima, as camadas de dados embaixo e o "Atualizar" ao lado delas.
// A base é a camada de baixo da pilha, por isso mora aqui e não num botão à parte.

// Miniaturas feitas só de tokens: lembram a base sem baixar imagem nenhuma.
const SWATCH: Record<BasemapKey, string> = {
  mineral: 'linear-gradient(135deg, var(--color-map-grass) 0 55%, var(--color-map-water) 55%)',
  'satellite-soft': 'linear-gradient(135deg, color-mix(in oklab, var(--color-muted-foreground) 45%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-muted-foreground) 55%, var(--color-water)) 55%)',
  satellite: 'linear-gradient(135deg, color-mix(in oklab, var(--color-foreground) 60%, var(--color-ok)) 0 55%, color-mix(in oklab, var(--color-foreground) 55%, var(--color-water)) 55%)',
  streets: 'linear-gradient(135deg, var(--color-background) 0 55%, var(--color-border) 55%)',
  osm: 'linear-gradient(135deg, var(--color-map-urban) 0 55%, var(--color-map-grass) 55%)',
}

type LayerManagerProps = React.ComponentProps<typeof LayerManager>

interface LayersPanelProps extends LayerManagerProps {
  /** base escolhida pelo usuário */
  basemap: BasemapKey
  /** base que está de fato na tela (difere da escolhida quando o Mineral não carregou) */
  shownBasemap: BasemapKey
  onBasemapChange: (key: BasemapKey) => void
  /** alguma camada ainda está chegando */
  refreshing: boolean
  onRefresh: () => void
}

export function LayersPanel({ basemap, shownBasemap, onBasemapChange, refreshing, onRefresh, ...layerProps }: LayersPanelProps) {
  const unavailable = basemap !== shownBasemap

  // O rótulo muda no próprio botão (8.4): Atualizar → Atualizando… → Atualizado.
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
    <div className="space-y-5">
      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mapa base</h4>
        <div role="radiogroup" aria-label="Mapa base" className="grid grid-cols-3 gap-2">
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
                  'flex flex-col items-center gap-1 rounded-md border p-1.5 text-xs transition-[background-color,border-color,transform] duration-180 ease-out active:scale-[0.96] focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30',
                  selected ? 'border-primary bg-secondary font-medium text-secondary-foreground' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <span className="h-8 w-full rounded-sm border border-border" style={{ background: SWATCH[key] }} aria-hidden />
                {BASEMAP_LABELS[key]}
              </button>
            )
          })}
        </div>
        {unavailable && (
          <p role="status" className="mt-2 text-xs text-muted-foreground">
            {BASEMAP_LABELS[basemap]} indisponível agora. Mostrando {BASEMAP_LABELS[shownBasemap]}.
          </p>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Camadas de dados</h4>
          <button
            type="button"
            aria-disabled={refreshing}
            onClick={() => { if (refreshing) return; setClicked(true); onRefresh() }}
            className="group flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium text-muted-foreground transition-[background-color,color,transform] duration-180 ease-out hover:bg-muted hover:text-foreground active:scale-[0.96] aria-disabled:opacity-45 aria-disabled:hover:bg-transparent focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            {done ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden />}
            <span aria-live="polite">{refreshing ? 'Atualizando…' : done ? 'Atualizado' : 'Atualizar'}</span>
          </button>
        </div>
        <LayerManager {...layerProps} />
      </section>
    </div>
  )
}
