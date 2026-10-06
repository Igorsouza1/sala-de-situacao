'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import { cn } from '@/lib/utils'
import { controlSurface } from './helpers/control-style'
import { ICON_STROKE, resolveLayerIcon } from './helpers/layer-icons'
import { isLayerOn } from './helpers/layers'
import type { RuleLegendSection } from './helpers/legend-rules'
import { scaleBar } from './helpers/scale'
import { Legend, type LayerManagerOption } from './LayerManager'

// Legenda e escala do mapa (DESIGN.md 13.7): "o que é cada cor e cada ícone, e que tamanho tem isto?", sem abrir painel nenhum.
// É uma LEGENDA de verdade: título, e uma linha com a amostra e o nome de cada coisa, sempre à vista (uma fileira de ícones sem texto
// fazia a pessoa decifrar). Só entra o que está ligado e, nas camadas de pinos (Ações), só o que existe no mapa agora, em dois blocos:
// a COR (a situação) e o ÍCONE (a área), porque são duas coisas diferentes e a pessoa lê cada uma. O ícone fica em tom neutro, para
// não parecer que a cor é dele. O título recolhe a lista (a escolha fica guardada) e a barra de escala fica sempre embaixo.

const STORAGE_KEY = 'prisma:mapa:legenda'

interface MapLegendProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapRef: React.RefObject<any>
  ready: boolean
  options: LayerManagerOption[]
  activeLayers: string[]
  /** a legenda por regras (cor e ícone) das camadas de pinos, pela chave da camada */
  ruleLegends: Record<string, RuleLegendSection[]>
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

const readCollapsed = () => {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

function Row({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-9 items-center gap-3 px-1">
      {children}
      <span className="min-w-0 text-sm leading-snug">{label}</span>
    </div>
  )
}

/** a cor de um pino: um círculo cheio, na cor que o mapa usa, com o fio claro que o separa do cartão */
const ColorSwatch = ({ color }: { color: string }) => (
  <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center">
    <span className="h-4 w-4 rounded-full ring-2 ring-white" style={{ backgroundColor: color, boxShadow: '0 0 0 3px color-mix(in srgb, var(--color-foreground) 22%, transparent)' }} />
  </span>
)

/** o ícone de uma área: o desenho do pino, em tom neutro (a cor é outro bloco) */
const IconSwatch = ({ name }: { name: string }) => {
  const Icon = resolveLayerIcon(name)
  return (
    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-foreground/20">
      <Icon size={14} stroke={ICON_STROKE} />
    </span>
  )
}

export function MapLegend({ mapRef, ready, options, activeLayers, ruleLegends }: MapLegendProps) {
  const bar = useScale(mapRef, ready)
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => { setCollapsed(readCollapsed()) }, [])
  const toggle = () => {
    setCollapsed((v) => {
      try { localStorage.setItem(STORAGE_KEY, v ? '0' : '1') } catch { /* sem armazenamento: a escolha vale só agora */ }
      return !v
    })
  }

  // só o que está ligado; camada de pinos com regras mostra os blocos de cor e ícone no lugar de linha-mãe e áreas
  const entries = useMemo(
    () =>
      options
        .filter((o) => isLayerOn(o.slug, activeLayers))
        .map((o) => ({
          option: o,
          sections: ruleLegends[o.slug] ?? [],
          subs: (o.subOptions ?? []).filter((s) => activeLayers.includes(o.slug) || isLayerOn(s.slug, activeLayers)),
        })),
    [options, activeLayers, ruleLegends],
  )

  if (!ready) return null
  const hasLegend = entries.length > 0
  return (
    <div className={cn('absolute right-4 z-[400] flex max-h-[calc(100svh-15rem)] w-72 max-w-[calc(100vw-2rem)] flex-col rounded-lg bottom-[4.25rem] max-[1120px]:bottom-24', controlSurface)}>
      {hasLegend && (
        <>
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={toggle}
            className="flex h-11 w-full shrink-0 items-center justify-between rounded-t-lg px-4 text-left transition-colors duration-200 hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
          >
            <span className="text-sm font-semibold">Legenda</span>
            <ChevronUp className={cn('h-4 w-4 text-muted-foreground transition-[rotate] duration-300 ease-spring', collapsed && 'rotate-180')} aria-hidden />
          </button>

          {/* recolhe e abre em altura (8.4) */}
          <div className={cn('grid min-h-0 flex-1 transition-[grid-template-rows] duration-[320ms] ease-out', collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]')}>
            <div inert={collapsed} className={cn('flex min-h-0 flex-col overflow-hidden transition-opacity duration-[320ms] ease-out', collapsed ? 'opacity-0' : 'opacity-100')}>
              <OverlayScroll className="px-3 pb-3">
                <div className="space-y-1">
                  {entries.map(({ option, sections, subs }) =>
                    sections.length > 0 ? (
                      <div key={option.id} className="space-y-3 pt-1">
                        {sections.map((section) => (
                          <div key={section.title}>
                            <p className="px-1 pb-0.5 pt-1 text-xs font-semibold text-muted-foreground">{section.title} dos pinos</p>
                            {section.entries.map((e) => (
                              <Row key={e.key} label={e.label}>
                                {section.title === 'Cor' ? <ColorSwatch color={e.color ?? 'transparent'} /> : <IconSwatch name={e.iconName ?? 'map-pin'} />}
                              </Row>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : subs.length > 0 ? (
                      <div key={option.id}>
                        <Row label={option.label}>
                          <Legend option={option} checked />
                        </Row>
                        <div className="ml-4 border-l border-border pl-3">
                          {subs.map((sub) => (
                            <Row key={sub.id} label={sub.label}>
                              <Legend option={sub} checked />
                            </Row>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Row key={option.id} label={option.label}>
                        <Legend option={option} checked />
                      </Row>
                    ),
                  )}
                </div>
              </OverlayScroll>
            </div>
          </div>
        </>
      )}

      {bar && (
        <div className={cn('flex shrink-0 items-center gap-2 px-4 py-3', hasLegend && 'border-t border-border')} role="img" aria-label={`Escala: o traço vale ${bar.label}`}>
          <span aria-hidden style={{ width: bar.width }} className="h-1.5 shrink-0 border-x border-b border-foreground/60 transition-[width] duration-150 ease-out" />
          <span className="text-xs text-muted-foreground">{bar.label}</span>
        </div>
      )}
    </div>
  )
}
