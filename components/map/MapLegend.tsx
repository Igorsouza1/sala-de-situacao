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

  // Só o que está ligado. Uma camada com áreas que têm ícone próprio (Ações) NÃO aparece como linha-mãe: "Ações" não é nada que o mapa
  // desenhe, o que se vê são os pinos de cada área, e a legenda diz exatamente isso. Já a Fauna, cujas partes (calor e pontos) não
  // dizem de quê são sozinhas, mantém o nome da camada como título.
  const entries = useMemo(
    () =>
      options
        .filter((o) => isLayerOn(o.slug, activeLayers))
        .flatMap((o) => {
          const subs = (o.subOptions ?? []).filter((s) => activeLayers.includes(o.slug) || isLayerOn(s.slug, activeLayers))
          if (subs.length > 0 && subs.every((s) => s.legendType === 'icon')) return subs.map((s) => ({ option: s, subs: [] as LayerManagerOption[] }))
          return [{ option: o, subs }]
        }),
    [options, activeLayers],
  )
  const shown = entries.slice(0, MAX_SWATCHES)
  const hidden = entries.length - shown.length

  if (!ready) return null
  return (
    <div
      className={cn('absolute right-4 z-[400] w-max min-w-[13rem] max-w-[19rem] rounded-lg p-3 bottom-[4.25rem] max-[1120px]:bottom-24', controlSurface)}
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
            className="flex w-full items-center gap-2 rounded-sm p-1 text-left transition-colors duration-200 hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <span className="flex flex-1 items-center gap-1.5">
              {shown.map(({ option }) => <Legend key={option.id} option={option} checked />)}
              {hidden > 0 && <span className="px-1 text-xs text-muted-foreground">+{hidden}</span>}
            </span>
            <ChevronUp className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-[rotate] duration-300 ease-spring', !open && 'rotate-180')} aria-hidden />
          </button>

          {/* abre em altura (8.4): o que entra cresce, o que sai encolhe */}
          <div className={cn('grid transition-[grid-template-rows] duration-[320ms] ease-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div inert={!open} className={cn('min-h-0 overflow-hidden transition-opacity duration-[320ms] ease-out', open ? 'opacity-100' : 'opacity-0')}>
              <ul className="space-y-1 pb-3 pt-3">
                {entries.map(({ option, subs }) => (
                  <li key={option.id}>
                    <div className="flex min-h-9 items-center gap-3 px-1">
                      <Legend option={option} checked />
                      <span className="min-w-0 text-sm leading-snug">{option.label}</span>
                    </div>
                    {subs.length > 0 && (
                      <ul className="ml-4 border-l border-border pl-3">
                        {subs.map((sub) => (
                          <li key={sub.id} className="flex min-h-9 items-center gap-3 px-1">
                            <Legend option={sub} checked />
                            <span className="min-w-0 text-sm leading-snug">{sub.label}</span>
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
        <div className={cn('flex items-center gap-2', entries.length > 0 && 'mt-1 border-t border-border pt-3')} role="img" aria-label={`Escala: o traço vale ${bar.label}`}>
          <span aria-hidden style={{ width: bar.width }} className="h-1.5 shrink-0 border-x border-b border-foreground/60 transition-[width] duration-150 ease-out" />
          <span className="text-xs tabular-nums text-muted-foreground">{bar.label}</span>
        </div>
      )}
    </div>
  )
}
