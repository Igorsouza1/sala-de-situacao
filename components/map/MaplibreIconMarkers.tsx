'use client'

import { Marker, Popup, useMap } from 'react-map-gl/maplibre'
import { Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ICON_STROKE, resolveLayerIcon } from './helpers/layer-icons'
import { resolveFeatureStyle } from './helpers/map-visuals'
import { tidyText } from './helpers/text'
import { StackCard, type StackEntry } from './StackCard'
import type { LayerResponseDTO, MapFeatureCollection } from '@/types/map-dto'

// Marcadores das camadas de ícone (DESIGN.md 13.6). Longe do zoom 13, cada ação é um PONTO pequeno na cor da área, sem número nem
// bolha: a distribuição se lê de relance. Perto, o ponto vira um PINO com o ícone da área (a ponta fica no local exato). Ações
// exatamente no mesmo lugar dividem um pino, com o selo "+N"; passar o mouse mostra a lista e clicar a deixa aberta para escolher.
// O status (quando a feição tem) vira um selo no canto do pino.

// Com terreno 3D, cada Marker lê o framebuffer de profundidade (gl.readPixels: a GPU para e espera) a cada ~100 ms só para
// esmaecer atrás de morro. Com dezenas de ícones o mapa cai para ~20 fps; sem a checagem, o ícone só não esmaece atrás do relevo.
const skipOcclusionCheck = (marker: unknown) => {
  if (marker) (marker as { _updateOpacity: () => void })._updateOpacity = () => {}
}

const PIN_ZOOM = 13 // a partir daqui o ponto vira pino (um limite só: a pessoa aprende uma regra)
const PIN_HEIGHT = 44 // px: onde o cartão de hover ancora acima do pino
const DOT_HEIGHT = 14

// Selo de status: cor e forma dizem o estado (o concluído leva um check). Cores só dos tokens.
const STATUS_BADGE: Record<string, { label: string; className: string; check?: boolean }> = {
  'Identificado': { label: 'Identificado', className: 'bg-warn' },
  'Em Recuperação': { label: 'Em recuperação', className: 'bg-water' },
  'Concluído': { label: 'Concluído', className: 'bg-ok', check: true },
}

// translate e scale precisam estar na lista da transição (no Tailwind v4 não entram em transition-transform: caso C6)
const motion = 'transition-[translate,scale,box-shadow] duration-300 ease-spring active:scale-95 focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/40'

// A gota do pino: o corpo na cor da área, com um fio branco que a separa do satélite
const PIN_PATH = 'M16 41 C16 41 3 26.5 3 16 C3 8.3 8.8 2.5 16 2.5 C23.2 2.5 29 8.3 29 16 C29 26.5 16 41 16 41 Z'

interface Props {
  layer: LayerResponseDTO
  data: MapFeatureCollection
  onFeatureClick: (slug: string, props: Record<string, any>) => void
  onFeatureHover: (props: Record<string, any> | null, coords: [number, number] | null) => void
  /** avisa quando a lista de uma pilha está à vista: o mapa esconde o cartão da ação que está por baixo (um cartão por vez) */
  onStackHover?: (active: boolean) => void
}

interface View { zoom: number; bbox: [number, number, number, number] }

interface Spot {
  key: string
  lng: number
  lat: number
  entries: StackEntry[]
}

// coordenadas iguais até ~1 m (5 casas) são o mesmo lugar
const spotKey = (lng: number, lat: number) => `${lng.toFixed(5)},${lat.toFixed(5)}`

export function MaplibreIconMarkers({ layer, data, onFeatureClick, onFeatureHover, onStackHover }: Props) {
  const { current: mapRef } = useMap()
  const vc = layer.visualConfig
  // Normaliza para o mesmo formato que o Leaflet usa em resolveFeatureStyle
  const normalizedConfig = useMemo(() => ({
    baseStyle: vc?.baseStyle || vc,
    rules: vc?.rules,
  }), [vc])

  // O que a pessoa está vendo: só os marcadores da tela (com folga) viram DOM, e o zoom decide ponto ou pino.
  const [view, setView] = useState<View | null>(null)
  useEffect(() => {
    const map = mapRef?.getMap()
    if (!map) return
    const read = () => {
      const b = map.getBounds()
      const padLng = (b.getEast() - b.getWest()) * 0.2
      const padLat = (b.getNorth() - b.getSouth()) * 0.2
      setView({ zoom: map.getZoom(), bbox: [b.getWest() - padLng, b.getSouth() - padLat, b.getEast() + padLng, b.getNorth() + padLat] })
    }
    read()
    map.on('moveend', read)
    return () => { map.off('moveend', read) }
  }, [mapRef])

  // cada local do mapa, com as ações que estão nele
  const spots = useMemo<Spot[]>(() => {
    const byKey = new Map<string, Spot>()
    data.features.forEach((feature, idx) => {
      if (feature.geometry?.type !== 'Point') return
      const [lng, lat] = (feature.geometry as any).coordinates as [number, number]
      if (typeof lng !== 'number' || typeof lat !== 'number') return
      // resolveFeatureStyle processa todas as regras em ordem (categoria → status): a regra de categoria dá cor e ícone, a de status
      // pode dar opacidade (camadas concluídas)
      const style = resolveFeatureStyle(normalizedConfig, feature) as any
      const props = feature.properties ?? {}
      const entry: StackEntry = {
        key: feature.id != null ? `${layer.slug}-${feature.id}` : `${layer.slug}-idx-${idx}`,
        props,
        name: tidyText(String(props.name || props.acao || '')) || 'Ação sem nome',
        status: props.status as string | undefined,
        color: style.color || 'var(--color-primary)',
        iconName: style.iconName || 'map-pin',
        opacity: style.opacity ?? 1,
      }
      const key = spotKey(lng, lat)
      const spot = byKey.get(key)
      if (spot) spot.entries.push(entry)
      else byKey.set(key, { key, lng, lat, entries: [entry] })
    })
    return [...byKey.values()]
  }, [data, normalizedConfig, layer.slug])

  const visible = useMemo(() => {
    if (!view) return []
    const [w, s, e, n] = view.bbox
    return spots.filter((p) => p.lng >= w && p.lng <= e && p.lat >= s && p.lat <= n)
  }, [spots, view])
  const asPin = (view?.zoom ?? 0) >= PIN_ZOOM

  // A lista de uma pilha: ao passar o mouse é só leitura; ao clicar fica aberta, com as linhas clicáveis (fecha no Esc ou clicando fora).
  const [stack, setStack] = useState<{ spot: Spot; pinned: boolean } | null>(null)
  useEffect(() => {
    onStackHover?.(stack !== null)
    return () => onStackHover?.(false)
  }, [stack, onStackHover])
  useEffect(() => {
    if (!stack?.pinned) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setStack(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stack?.pinned])

  return (
    <>
      {visible.map((spot) => {
        const first = spot.entries[0]
        const extra = spot.entries.length - 1
        const Icon = resolveLayerIcon(first.iconName)
        const badge = extra === 0 ? STATUS_BADGE[first.status as string] : undefined
        const label = extra > 0 ? `${spot.entries.length} ações neste ponto. Clique para ver a lista.` : badge ? `${first.name}. ${badge.label}.` : first.name
        const open = () => (extra > 0 ? setStack({ spot, pinned: true }) : onFeatureClick(layer.slug, first.props))
        const enter = () => (extra > 0 ? setStack((s) => (s?.pinned ? s : { spot, pinned: false })) : onFeatureHover({ ...first.props, _slug: layer.slug, _h: asPin ? PIN_HEIGHT : DOT_HEIGHT }, [spot.lng, spot.lat]))
        const leave = () => (extra > 0 ? setStack((s) => (s?.pinned ? s : null)) : onFeatureHover(null, null))
        const keys = (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open() } }
        return (
          <Marker key={spot.key} ref={skipOcclusionCheck} longitude={spot.lng} latitude={spot.lat} anchor={asPin ? 'bottom' : 'center'} onClick={(e) => { e.originalEvent.stopPropagation(); open() }}>
            {asPin ? (
              <div
                role="button"
                tabIndex={0}
                aria-label={label}
                style={{ opacity: first.opacity }}
                className={cn('animate-pin-in relative h-11 w-8 origin-bottom cursor-pointer hover:-translate-y-0.5 hover:scale-110', motion)}
                onKeyDown={keys}
                onMouseEnter={enter}
                onMouseLeave={leave}
                onFocus={enter}
                onBlur={leave}
              >
                <svg viewBox="0 0 32 44" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden>
                  <path d={PIN_PATH} style={{ fill: first.color }} stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span className="absolute left-1/2 top-[16px] -translate-x-1/2 -translate-y-1/2" aria-hidden>
                  <Icon size={16} color="white" stroke={ICON_STROKE} />
                </span>
                {badge && (
                  <span aria-hidden className={cn('absolute -right-1 top-0 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-white', badge.className)}>
                    {badge.check && <Check className="h-2 w-2 text-white" strokeWidth={4} />}
                  </span>
                )}
                {extra > 0 && (
                  <span aria-hidden className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold leading-none text-background ring-2 ring-white">
                    +{extra}
                  </span>
                )}
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label={label}
                style={{ opacity: first.opacity, backgroundColor: first.color }}
                className={cn('animate-pop h-3.5 w-3.5 cursor-pointer rounded-full shadow-control ring-2 ring-white hover:scale-150', motion)}
                onKeyDown={keys}
                onMouseEnter={enter}
                onMouseLeave={leave}
                onFocus={enter}
                onBlur={leave}
              />
            )}
          </Marker>
        )
      })}
      {stack && (
        <Popup
          longitude={stack.spot.lng}
          latitude={stack.spot.lat}
          closeButton={false}
          closeOnClick
          onClose={() => setStack(null)}
          offset={[0, -((asPin ? PIN_HEIGHT : DOT_HEIGHT) + 8)] as any}
          anchor="bottom"
          className={cn('acao-hover-popup', stack.pinned && 'acao-hover-popup-pinned')}
        >
          <StackCard entries={stack.spot.entries} interactive={stack.pinned} onPick={(entry) => { setStack(null); onFeatureClick(layer.slug, entry.props) }} />
        </Popup>
      )}
    </>
  )
}
