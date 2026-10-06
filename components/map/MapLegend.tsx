'use client'

import { useEffect, useMemo, useState } from 'react'
import { Info, ListChecks, X } from 'lucide-react'
import { OverlayScroll } from '@/components/ui/overlay-scroll'
import { cn } from '@/lib/utils'
import { collectAttributions, parseAttribution } from './helpers/attribution'
import { controlItem, controlSurface } from './helpers/control-style'
import { ICON_STROKE, resolveLayerIcon } from './helpers/layer-icons'
import { isLayerOn } from './helpers/layers'
import type { RuleLegendSection } from './helpers/legend-rules'
import { scaleBar } from './helpers/scale'
import { Legend, type LayerManagerOption } from './LayerManager'
import { PanelCard } from './PanelCard'

// O controle de canto do mapa (DESIGN.md 13.7): a escala, a legenda e os créditos juntos, num cartão só no canto de baixo à direita,
// na linguagem dos controles (borda, sombra, raio e botões com rótulo). A legenda e os créditos abrem para cima, como os painéis do
// dock: cabeçalho com título e fechar, base cinza e um cartão branco com título por assunto. Um painel por vez.
// A legenda mostra só o que está ligado, com a amostra igual ao que o mapa desenha; nas camadas de pinos (Ações), só o que existe no
// mapa agora, em dois cartões: a COR (a situação) e o ÍCONE (a área), que são coisas diferentes. Os créditos substituem o botão do
// MapLibre, que abria expandido e ficava por baixo da legenda.

const STORAGE_KEY = 'prisma:mapa:legenda'

type Panel = 'legend' | 'credits' | null

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

/** os créditos de cada fonte do estilo do mapa (a base de agora) */
function useCredits(mapRef: MapLegendProps['mapRef'], ready: boolean) {
  const [credits, setCredits] = useState<string[]>([])
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!ready || !map) return
    const read = () => setCredits(collectAttributions(map.getStyle()))
    read()
    map.on('styledata', read)
    return () => { map.off('styledata', read) }
  }, [mapRef, ready])
  return credits
}

function Row({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-10 items-center gap-3">
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

/** o ícone de uma área: o desenho do pino, em tom neutro (a cor é outro cartão) */
const IconSwatch = ({ name }: { name: string }) => {
  const Icon = resolveLayerIcon(name)
  return (
    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-foreground ring-1 ring-foreground/20">
      <Icon size={14} stroke={ICON_STROKE} />
    </span>
  )
}

/** o painel que abre para cima do controle: a mesma anatomia dos painéis do dock (cabeçalho, base cinza, cartões) */
function CornerPanel({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      inert={!open}
      className={cn(
        'absolute bottom-full right-0 mb-3 flex max-h-[calc(100svh-14rem)] w-[22rem] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-lg',
        'transition-[opacity,translate,scale,visibility]',
        controlSurface,
        open ? 'visible scale-100 opacity-100 duration-[240ms] ease-spring' : 'invisible translate-y-2 scale-95 opacity-0 duration-150 ease-in',
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border py-2.5 pl-5 pr-3">
        <h3 className="whitespace-nowrap text-base font-semibold">{title}</h3>
        <button type="button" aria-label={`Fechar ${title}`} onClick={onClose} className={cn('flex h-8 w-8 items-center justify-center', controlItem())}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>
      <OverlayScroll className="bg-muted/50 p-4">{children}</OverlayScroll>
    </div>
  )
}

export function MapLegend({ mapRef, ready, options, activeLayers, ruleLegends }: MapLegendProps) {
  const bar = useScale(mapRef, ready)
  const credits = useCredits(mapRef, ready)
  const [panel, setPanel] = useState<Panel>(null)

  // a legenda abre sozinha na primeira visita em tela grande (a pessoa não precisa procurar o que é cada cor) e depois lembra a escolha
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setPanel(saved === 'aberta' || (saved === null && window.innerWidth >= 1024) ? 'legend' : null)
    } catch {
      setPanel(window.innerWidth >= 1024 ? 'legend' : null)
    }
  }, [])
  const choose = (next: Panel) => {
    setPanel(next)
    if (next === 'legend' || panel === 'legend') {
      try { localStorage.setItem(STORAGE_KEY, next === 'legend' ? 'aberta' : 'fechada') } catch { /* a escolha vale só agora */ }
    }
  }
  useEffect(() => {
    if (!panel) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) setPanel(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel])

  // só o que está ligado; camada de pinos com regras ganha os cartões de cor e ícone no lugar de linha-mãe e áreas
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
  const plainEntries = entries.filter((e) => e.sections.length === 0)
  const ruleSections = entries.flatMap((e) => e.sections)
  const hasLegend = entries.length > 0

  if (!ready) return null
  return (
    <div className="absolute bottom-4 right-4 z-[400] max-[1120px]:bottom-24">
      <div className="relative">
        <CornerPanel open={panel === 'legend' && hasLegend} title="Legenda" onClose={() => choose(null)}>
          <div className="space-y-4">
            {plainEntries.length > 0 && (
              <PanelCard title="Camadas">
                <div>
                  {plainEntries.map(({ option, subs }) =>
                    subs.length > 0 ? (
                      <div key={option.id}>
                        <Row label={option.label}>
                          <Legend option={option} checked />
                        </Row>
                        <div className="ml-3 border-l border-border pl-3">
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
              </PanelCard>
            )}
            {ruleSections.map((section) => (
              <PanelCard key={section.title} title={`${section.title} dos pinos`}>
                <div>
                  {section.entries.map((e) => (
                    <Row key={e.key} label={e.label}>
                      {section.title === 'Cor' ? <ColorSwatch color={e.color ?? 'transparent'} /> : <IconSwatch name={e.iconName ?? 'map-pin'} />}
                    </Row>
                  ))}
                </div>
              </PanelCard>
            ))}
          </div>
        </CornerPanel>

        <CornerPanel open={panel === 'credits'} title="Créditos do mapa" onClose={() => choose(null)}>
          <PanelCard title="De onde vem o mapa" caption="Os provedores pedem que estes créditos fiquem à vista de quem usa o mapa.">
            <ul className="space-y-2 text-sm leading-snug">
              {credits.map((html) => (
                <li key={html}>
                  {parseAttribution(html).map((part, i) =>
                    part.href ? (
                      <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">{part.text}</a>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </li>
              ))}
              <li>
                Mapa feito com <a href="https://maplibre.org" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">MapLibre</a>.
              </li>
            </ul>
          </PanelCard>
        </CornerPanel>

        <div role="group" aria-label="Escala, legenda e créditos" className={cn('flex items-stretch gap-0.5 rounded-md p-1', controlSurface)}>
          {hasLegend && (
            <>
              <button type="button" aria-expanded={panel === 'legend'} onClick={() => choose(panel === 'legend' ? null : 'legend')} className={cn('flex h-9 items-center gap-2 px-3 text-sm font-medium', controlItem(panel === 'legend'))}>
                <ListChecks className="h-4 w-4" aria-hidden />
                Legenda
              </button>
              {bar && <div role="separator" aria-orientation="vertical" className="mx-0.5 my-1.5 w-px bg-border" />}
            </>
          )}
          {bar && (
            <div className="flex items-center gap-2 px-3" role="img" aria-label={`Escala: o traço vale ${bar.label}`}>
              <span aria-hidden style={{ width: bar.width }} className="h-1.5 shrink-0 border-x border-b border-foreground/60 transition-[width] duration-150 ease-out" />
              <span className="text-xs text-muted-foreground">{bar.label}</span>
            </div>
          )}
          <div role="separator" aria-orientation="vertical" className="mx-0.5 my-1.5 w-px bg-border" />
          <button type="button" aria-expanded={panel === 'credits'} aria-label="Créditos do mapa" title="Créditos do mapa" onClick={() => choose(panel === 'credits' ? null : 'credits')} className={cn('flex h-9 w-9 items-center justify-center', controlItem(panel === 'credits'))}>
            <Info className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
