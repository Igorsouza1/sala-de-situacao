import { buildGrid, datumLine, formatDecimal } from '../helpers/grid'

describe('formatDecimal', () => {
  it('oeste e sul levam o sinal de menos, e a vírgula é a decimal', () => {
    expect(formatDecimal(-56.6947, 4)).toBe('-56,6947°')
    expect(formatDecimal(-21.3278, 4)).toBe('-21,3278°')
    expect(formatDecimal(12.5, 1)).toBe('12,5°')
  })

  it('sem casas decimais não sobra vírgula, e zero nunca vira "-0"', () => {
    expect(formatDecimal(-57, 0)).toBe('-57°')
    expect(formatDecimal(-0.00001, 2)).toBe('0,00°')
    expect(formatDecimal(-0, 0)).toBe('0°')
  })
})

describe('grade em graus decimais', () => {
  const b = { west: -57.0, south: -21.4, east: -56.6, north: -21.0 }
  const { lines } = buildGrid(b, 'dd')

  it('tem linhas dos dois eixos e todos os rótulos têm sinal, vírgula e grau', () => {
    expect(lines.some((l) => l.axis === 'meridian')).toBe(true)
    expect(lines.some((l) => l.axis === 'parallel')).toBe(true)
    lines.forEach((l) => expect(l.label).toMatch(/^-\d+(,\d+)?°$/))
  })

  it('o rótulo bate com a posição da linha', () => {
    for (const l of lines) {
      const value = Number(l.label.replace('°', '').replace(',', '.'))
      const [lng, lat] = l.points[0]
      expect(l.axis === 'meridian' ? lng : lat).toBeCloseTo(value, 6)
    }
  })

  it('o intervalo é redondo e todos os rótulos têm o mesmo número de casas', () => {
    const decimals = new Set(lines.map((l) => (l.label.split(',')[1] ?? '').replace('°', '').length))
    expect(decimals.size).toBe(1)
  })

  it('o rodapé diz que são graus decimais', () => {
    expect(datumLine('dd', -56.7)).toContain('graus decimais')
  })
})
