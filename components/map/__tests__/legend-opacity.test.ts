import { DEFAULT_MAP_LEGEND_OPACITY, DEFAULT_SHEET_LEGEND_OPACITY, LEGEND_ALPHA, LEGEND_OPACITIES, isLegendOpacity, legendFillStyle } from '../helpers/legend-opacity'

describe('opacidade da legenda', () => {
  it('três graus, do mais cheio ao mais vazado', () => {
    expect(LEGEND_OPACITIES).toEqual(['solid', 'soft', 'clear'])
    const alphas = LEGEND_OPACITIES.map((l) => LEGEND_ALPHA[l])
    expect(alphas).toEqual([...alphas].sort((a, b) => b - a))
    expect(alphas[0]).toBe(1)
  })

  it('cheio usa o token puro, sem mistura; os outros misturam com transparente', () => {
    expect(legendFillStyle('solid')).toMatchObject({ '--legend-card': 'var(--color-card)' })
    expect(legendFillStyle('soft')).toMatchObject({ '--legend-card': 'color-mix(in srgb, var(--color-card) 85%, transparent)' })
    expect(legendFillStyle('clear')).toMatchObject({ '--legend-card': 'color-mix(in srgb, var(--color-card) 60%, transparent)' })
  })

  it('só os três nomes valem', () => {
    expect(isLegendOpacity('soft')).toBe(true)
    expect(isLegendOpacity('metade')).toBe(false)
    expect(isLegendOpacity(0.5)).toBe(false)
  })

  it('cada lugar tem o seu padrão: folha cheia, mapa suave', () => {
    expect(DEFAULT_SHEET_LEGEND_OPACITY).toBe('solid')
    expect(DEFAULT_MAP_LEGEND_OPACITY).toBe('soft')
  })
})
