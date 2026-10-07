import { MAX_BLOCKS, clampPos, newBlock, type MapBlock } from '../helpers/gerar-mapa'

describe('textos soltos sobre o mapa', () => {
  it('o centro nunca chega à borda: o bloco não some do mapa', () => {
    expect(clampPos(-1)).toBeGreaterThan(0)
    expect(clampPos(2)).toBeLessThan(1)
    expect(clampPos(0.5)).toBe(0.5)
  })

  it('o bloco novo nasce vazio, no meio do mapa e com id próprio', () => {
    const a = newBlock([])
    const b = newBlock([a])
    expect(a.text).toBe('')
    expect(a.x).toBe(0.5)
    expect(a.id).not.toBe(b.id)
  })

  it('os blocos seguintes nascem mais abaixo, sem ficar em cima do anterior, e sempre dentro do mapa', () => {
    const all: MapBlock[] = []
    for (let i = 0; i < MAX_BLOCKS; i++) all.push(newBlock(all))
    const ys = all.map((b) => b.y)
    expect(new Set(ys).size).toBe(MAX_BLOCKS)
    all.forEach((b) => { expect(b.y).toBeGreaterThan(0); expect(b.y).toBeLessThan(1) })
  })
})
