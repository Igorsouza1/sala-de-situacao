import { readStyle } from '@/lib/layer-style'

// A legenda lê pelo mesmo modelo que o mapa e o editor (lib/layer-style.ts): o que ela mostra é o que o mapa desenha.
// Antes lia só o baseStyle, e o mapa desenhava com o maplibre.paint, então a cor da legenda podia diferir da do mapa.
export type LegendType = 'point' | 'line' | 'polygon' | 'circle' | 'icon' | 'heatmap'

export const getLayerLegendInfo = (visualConfig: any) => {
  const style = readStyle(visualConfig)
  const hasType = !!(visualConfig?.maplibre?.type ?? visualConfig?.baseStyle?.type ?? visualConfig?.mapMarker?.type ?? visualConfig?.type)
  const legendType: LegendType =
    style.shape === 'line' ? 'line'
    : style.shape === 'circle' ? 'circle'
    : style.shape === 'icon' ? 'icon'
    : style.shape === 'other' ? 'heatmap'
    : !hasType && style.iconName ? 'icon' // sem tipo nenhum, mas com ícone: é um marcador
    : 'polygon'

  return {
    legendType,
    iconName: style.iconName,
    color: style.color,
    fillColor: style.fillColor,
    fillOpacity: style.fillOpacity,
  }
}
