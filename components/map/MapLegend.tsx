'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlSurface } from './helpers/control-style'
import { isLayerOn } from './helpers/layers'
import { scaleBar } from './helpers/scale'
import { Legend, type LayerManagerOption } from './LayerManager'

// Legenda e escala do mapa (DESIGN.md 13.7): "o que é cada cor e que tamanho tem isto?", sem abrir painel nenhum. Um cartão pequeno
// no canto de baixo à direita, só com as camadas LIGADAS e a amostra fiel ao mapa (6.2 regra 5). Recolhido, são as amostras numa linha
// (até 6, e "+N"); ao passar o mouse, focar ou tocar, abre com o nome de cada uma e, nas camadas com áreas (Ações), a de cada área.
// A barra de escala fica sempre embaixo, com uma distância redonda. Sem camada ligada, fica só a escala.

const MAX_SWATCHES = 6

interface MapLegendProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapRef: React.RefObject<any>
  ready: boolean
  options: LayerManagerOption[]
  activeLayers: string[]
}

function useScale(mapRef: MapLegendProps['mapRef'], ready: boolean) {
  const [bar, setBar] = useState<{ width: number; label: string } | null>(null)
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!ready || !map) return
    let raf = 0
    const update = () => {
      raf = 0
      setBar(scaleBar(map.getCenter().lat, map.getZoom()))
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    map.on('zoom', schedule)
    map.on('move', schedule)
    return () => { map.off('zoom', schedule); map.off('move', schedule); if (raf) cancelAnimationFrame(raf) }
  }, [mapRef, ready])
  return bar
}

export function MapLegend({ mapRef, ready, options, activeLayers }: MapLegendProps) {
  const bar = useScale(mapRef, ready)
  const [pinned, setPinned] = useState(false)
  const [hover, setHover] = useState(false)
  const open = pinned || hover

  // só o que está ligado, e dentro de uma camada com áreas só as áreas ligadas
  const entries = useMemo(
    () =>
      options
        .filter((o) => isLayerOn(o.slug, activeLayers))
        .map((o) => ({ option: o, subs: (o.subOptions ?? []).filter((s) => activeLayers.includes(o.slug) || isLayerOn(s.slug, activeLayers)) })),
    [options, activeLayers],
  )
  const shown = entries.slice(0, MAX_SWATCHES)
  const hidden = entries.length - shown.length

  if (!ready) return null
  return (
    <div
      className={cn('absolute bottom-24 right-3 z-[400] w-max max-w-[16rem] rounded-lg p-2', controlSurface)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(false) }}
    >
      {entries.length > 0 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Recolher a legenda' : 'Mostrar a legenda'}
            onClick={() => setPinned((v) => !v)}
            className="flex w-full items-center gap-1.5 rounded-sm text-left transition-colors duration-200 hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <span className="flex flex-1 items-center gap-1">
              {shown.map(({ option }) => <Legend key={option.id} option={option} checked />)}
              {hidden > 0 && <span className="px-1 text-xs text-muted-foreground">+{hidden}</span>}
            </span>
            <ChevronUp className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-[rotate] duration-300 ease-spring', !open && 'rotate-180')} aria-hidden />
          </button>

          {/* abre em altura (8.4): o que entra cresce, o que sai encolhe */}
          <div className={cn('grid transition-[grid-template-rows] duration-[320ms] ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div inert={!open} className={cn('min-h-0 overflow-hidden transition-opacity duration-[320ms] ease-out', open ? 'opacity-100' : 'opacity-0')}>
              <ul className="space-y-1 pb-2 pt-2">
                {entries.map(({ option, subs }) => (
                  <li key={option.id}>
                    <div className="flex items-center gap-2.5">
                      <Legend option={option} checked />
                      <span className="min-w-0 truncate text-sm">{option.label}</span>
                    </div>
                    {subs.length > 0 && (
                      <ul className="ml-3 mt-1 space-y-0.5 border-l border-border pl-3">
                        {subs.map((sub) => (
                          <li key={sub.id} className="flex items-center gap-2.5">
                            <Legend option={sub} checked />
                            <span className="min-w-0 truncate text-xs text-muted-foreground">{sub.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {bar && (
        <div className={cn('flex items-center gap-2', entries.length > 0 && 'mt-1.5 border-t border-border pt-2')} role="img" aria-label={`Escala: o traço vale ${bar.label}`}>
          <span aria-hidden style={{ width: bar.width }} className="h-1.5 shrink-0 border-x border-b border-foreground/60 transition-[width] duration-150 ease-out" />
          <span className="text-xs tabular-nums text-muted-foreground">{bar.label}</span>
        </div>
      )}
    </div>
  )
}
