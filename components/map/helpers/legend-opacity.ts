import type { CSSProperties } from 'react'

// O fundo da legenda: três graus em palavras, sem número (DESIGN.md regra 1). Cheio é o cartão branco de sempre; os outros deixam o mapa
// aparecer por baixo. O mesmo vale para a legenda do mapa principal e para a da folha do Gerar mapa (13.9).
export const LEGEND_OPACITIES = ['solid', 'soft', 'clear'] as const
export type LegendOpacity = (typeof LEGEND_OPACITIES)[number]

export const LEGEND_OPACITY_LABELS: Record<LegendOpacity, string> = { solid: 'Cheio', soft: 'Suave', clear: 'Vazado' }

/** o quanto do branco fica: 100%, 85% e 60% */
export const LEGEND_ALPHA: Record<LegendOpacity, number> = { solid: 1, soft: 0.85, clear: 0.6 }

// o padrão de cada lugar: a folha impressa precisa ler bem (cheio); no mapa, a legenda não esconde o que está por baixo (suave)
export const DEFAULT_SHEET_LEGEND_OPACITY: LegendOpacity = 'solid'
export const DEFAULT_MAP_LEGEND_OPACITY: LegendOpacity = 'soft'

export const isLegendOpacity = (v: unknown): v is LegendOpacity => typeof v === 'string' && (LEGEND_OPACITIES as readonly string[]).includes(v)

const mix = (token: string, alpha: number) => (alpha >= 1 ? `var(${token})` : `color-mix(in srgb, var(${token}) ${Math.round(alpha * 100)}%, transparent)`)

/** as variáveis que o painel lê: o cartão e a base cinza, os dois com o mesmo grau de opacidade */
export function legendFillStyle(level: LegendOpacity): CSSProperties {
  const a = LEGEND_ALPHA[level]
  return { ['--legend-card' as string]: mix('--color-card', a), ['--legend-base' as string]: mix('--color-muted', a * 0.5) } as CSSProperties
}
