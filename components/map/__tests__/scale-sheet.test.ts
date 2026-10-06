import { metersPerPixel, paperScale, paperScaleBar } from '../helpers/scale'

// o MapLibre desenha o mundo em 512 px no zoom 0 (e não em 256): no equador, no zoom 0, um pixel vale 40.075.017 m / 512
describe('metersPerPixel (mundo de 512 px)', () => {
  it('no equador, no zoom 0, um pixel vale 78.271,5 m', () => {
    expect(metersPerPixel(0, 0)).toBeCloseTo(78271.517, 2)
  })
  it('cada zoom divide por dois e a latitude encurta pelo cosseno', () => {
    expect(metersPerPixel(0, 1)).toBeCloseTo(metersPerPixel(0, 0) / 2, 3)
    expect(metersPerPixel(-21, 12)).toBeCloseTo((78271.517 * Math.cos((21 * Math.PI) / 180)) / 4096, 3)
  })
})

describe('paperScale', () => {
  // um quadro de 277 mm de largura mostrado em 1108 px: 4 px por mm
  const frame = { mm: 277, px: 1108 }

  it('o metro por milímetro do papel sai do metro por pixel da tela e de quantos pixels cabem em um milímetro', () => {
    const z = 12
    const mppScreen = metersPerPixel(-21.3, z)
    const s = paperScale(-21.3, z, frame)
    expect(s.metersPerMm).toBeCloseTo(mppScreen * 4, 6)
    expect(s.ratio).toBeCloseTo(mppScreen * 4 * 1000, 3)
  })

  it('o rótulo é arredondado (aproximado) e usa ponto de milhar', () => {
    const s = paperScale(0, 0, { mm: 100, px: 100 }) // 78.271 m por mm → 1:78.271.517
    expect(s.label).toBe('1:78.000.000')
  })

  it('aproximar o zoom em 1 divide a razão por dois', () => {
    const a = paperScale(-21.3, 11, frame).ratio
    const b = paperScale(-21.3, 12, frame).ratio
    expect(a / b).toBeCloseTo(2, 6)
  })

  it('moldura sem tamanho não quebra', () => {
    expect(paperScale(-21.3, 12, { mm: 0, px: 0 }).label).toBe('')
  })
})

describe('paperScaleBar', () => {
  const frame = { mm: 277, px: 1108 }

  it('a barra vale uma distância redonda e não passa do tamanho máximo pedido', () => {
    const bar = paperScaleBar(-21.3, 12, frame, 40)
    expect(bar.widthMm).toBeLessThanOrEqual(40)
    expect(bar.widthMm).toBeGreaterThan(15)
    expect([1, 2, 5].includes(Number(String(bar.meters)[0]))).toBe(true)
  })

  it('a largura em milímetros bate com a distância: metros / metros-por-milímetro', () => {
    const bar = paperScaleBar(-21.3, 12, frame, 40)
    expect(bar.widthMm).toBeCloseTo(bar.meters / paperScale(-21.3, 12, frame).metersPerMm, 6)
  })

  it('rótulos 0, meio e fim, com a unidade só no fim: metros', () => {
    const bar = paperScaleBar(-21.3, 16, frame, 40)
    expect(bar.ticks[0]).toBe('0')
    expect(bar.ticks.at(-1)).toMatch(/ m$/)
    expect(bar.ticks).toHaveLength(3)
    expect(bar.ticks[1]).not.toMatch(/m|km/)
  })

  it('a partir de 1 km os rótulos viram quilômetros, com vírgula decimal', () => {
    const bar = paperScaleBar(-21.3, 9, frame, 40)
    expect(bar.ticks.at(-1)).toMatch(/ km$/)
    const half = paperScaleBar(-21.3, 9, { mm: 277, px: 1108 }, 40)
    expect(half.ticks.join('')).not.toMatch(/\./)
  })

  it('moldura sem tamanho: barra vazia', () => {
    expect(paperScaleBar(-21.3, 12, { mm: 0, px: 0 }, 40)).toEqual({ widthMm: 0, meters: 0, ticks: [] })
  })
})
