'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { Popup } from 'react-map-gl/maplibre'
import type { LayerResponseDTO } from '@/types/map-dto'
import { AcaoHoverCard } from './AcaoHoverCard'
import { resolveFeatureStyle } from './helpers/map-visuals'
import type { HoverStore } from './helpers/hover-store'

// Os cartões do hover (DESIGN.md 13.4): o da ação e o tooltip das outras camadas. Mora aqui, separado do mapa, para que passar o mouse
// refaça só estes cartões e não o MapLibreMap inteiro.
export function MapHoverPopups({ store, layers, hidden }: { store: HoverStore; layers: LayerResponseDTO[]; hidden: boolean }) {
  const { feature, coords } = useSyncExternalStore(store.subscribe, store.get, store.get)

  const layer = useMemo(() => (feature ? layers.find((l) => l.slug === feature._slug) ?? null : null), [feature, layers])
  // cor e ícone do cartão da ação: o mesmo cálculo do marcador (6.2, regra 13), nunca um palpite a partir do evento
  const acaoStyle = useMemo(() => {
    if (feature?._slug !== 'acoes') return null
    const vc = layer?.visualConfig as any
    return resolveFeatureStyle({ baseStyle: vc?.baseStyle || vc, rules: vc?.rules }, { properties: feature } as any) as { color?: string; iconName?: string }
  }, [feature, layer])
  const fields = layer?.visualConfig?.popupFields || layer?.schemaConfig?.fields || null

  // um cartão por vez: com a lista de uma pilha à vista, o cartão da ação que está por baixo não abre (13.6)
  if (hidden || !feature || !coords) return null

  if (feature._slug === 'acoes') {
    return (
      <Popup
        longitude={coords[0]}
        latitude={coords[1]}
        closeButton={false}
        offset={[0, -((feature._h as number | undefined) ?? 22) - 8] as any}
        anchor="bottom"
        className="acao-hover-popup"
      >
        <AcaoHoverCard properties={feature} color={acaoStyle?.color} iconName={acaoStyle?.iconName} />
      </Popup>
    )
  }

  if (!fields?.length) return null
  return (
    <Popup longitude={coords[0]} latitude={coords[1]} closeButton={false} offset={[0, -8] as any} anchor="bottom">
      <div className="p-1 min-w-[150px]">
        <h3 className="font-bold mb-1 text-xs border-b pb-1">{layer?.name}</h3>
        <div className="space-y-0.5 text-[10px]">
          {fields.map((field) => (
            <div key={field.key} className="flex justify-between gap-4">
              <span className="text-muted-foreground">{field.label}:</span>
              <span className="font-medium text-foreground">{feature[field.key] ?? '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </Popup>
  )
}
