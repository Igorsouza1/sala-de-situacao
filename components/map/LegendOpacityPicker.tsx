'use client'

import { ChoiceTiles } from './ChoiceTiles'
import { LEGEND_OPACITIES, LEGEND_OPACITY_LABELS, legendFillStyle, type LegendOpacity } from './helpers/legend-opacity'

// O fundo da legenda em três ladrilhos: cada um mostra o resultado (um cartão branco sobre um pedaço de mapa, no grau que a escolha
// dá), então a pessoa vê o que muda sem ler nem decifrar um número. A mesma escolha serve ao mapa e ao Gerar mapa.
export function LegendOpacityPicker({ value, onChange }: { value: LegendOpacity; onChange: (v: LegendOpacity) => void }) {
  return (
    <ChoiceTiles
      label="Fundo da legenda"
      value={value}
      onChange={onChange}
      options={LEGEND_OPACITIES.map((level) => ({
        value: level,
        label: LEGEND_OPACITY_LABELS[level],
        preview: (
          <span className="relative h-full w-full" style={{ background: 'linear-gradient(135deg, var(--color-map-grass) 0 50%, var(--color-map-water) 50%)' }}>
            <span className="absolute inset-1.5 rounded-sm border border-border" style={{ backgroundColor: legendFillStyle(level)['--legend-card' as keyof React.CSSProperties] as string }} />
          </span>
        ),
      }))}
    />
  )
}
