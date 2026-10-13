// O que uma camada importada guarda no catálogo. Fica fora da rota para a tela e o servidor falarem a mesma língua.

import { applyStyle, isHexColor, type LayerShape, type LayerStyle } from '@/lib/layer-style'
import type { GeometryKind } from './geojson'

/** Marca no catálogo as camadas que nasceram de um arquivo solto no mapa (só essas podem ser gravadas ou desfeitas pela importação). */
export const DROP_IMPORT_SOURCE = 'drop-import'

export const DEFAULT_IMPORT_COLOR = '#dc2626'

const SHAPE_OF: Record<GeometryKind, LayerShape> = { area: 'fill', linha: 'line', ponto: 'circle', misto: 'fill' }

export function importStyle(kind: GeometryKind, color: string): LayerStyle {
  const safe = isHexColor(color) ? color : DEFAULT_IMPORT_COLOR
  return {
    shape: SHAPE_OF[kind],
    color: safe,
    fillColor: safe,
    fillOpacity: 0.3,
    opacity: 0.9,
    weight: 2,
    radius: 6,
  }
}

export function importVisualConfig(kind: GeometryKind, color: string) {
  return applyStyle({ category: 'Uploads', defaultVisibility: true }, importStyle(kind, color))
}
