import { BLOCK_FONTS, BLOCK_SIZES, BLOCK_SIZE_MM, BLOCK_STYLES, DEFAULT_LOOK, MAX_BLOCKS, clampPos, newBlock, type MapBlock } from '../helpers/gerar-mapa'

describe('textos soltos na folha', () => {
  it('o centro nunca chega à borda: o bloco não some da folha', () => {
    expect(clampPos(-1)).toBeGreaterThan(0)
    expect(clampPos(2)).toBeLessThan(1)
    expect(clampPos(0.5)).toBe(0.5)
  })

  it('o bloco novo nasce vazio, no meio da folha, com id próprio e o jeito padrão', () => {
    const a = newBlock([])
    const b = newBlock([a])
    expect(a.text).toBe('')
    expect(a.x).toBe(0.5)
    expect(a.id).not.toBe(b.id)
    expect({ style: a.style, size: a.size, font: a.font }).toEqual(DEFAULT_LOOK)
  })

  it('o bloco novo herda o jeito do último que a pessoa mexeu', () => {
    expect(newBlock([], { style: 'outline', size: 'l', font: 'mono' })).toMatchObject({ style: 'outline', size: 'l', font: 'mono' })
  })

  it('os seguintes nascem mais abaixo, sem ficar em cima do anterior, e sempre dentro da folha', () => {
    const all: MapBlock[] = []
    for (let i = 0; i < 5; i++) all.push(newBlock(all))
    expect(new Set(all.map((b) => b.y)).size).toBe(5)
    all.forEach((b) => { expect(b.y).toBeGreaterThan(0); expect(b.y).toBeLessThan(1) })
    expect(MAX_BLOCKS).toBeGreaterThanOrEqual(5)
  })

  it('cada escolha tem no máximo três botões (DESIGN.md regra 1) e o padrão é uma delas', () => {
    for (const list of [BLOCK_STYLES, BLOCK_SIZES, BLOCK_FONTS]) expect(list.length).toBeLessThanOrEqual(3)
    expect(BLOCK_STYLES).toContain(DEFAULT_LOOK.style)
    expect(BLOCK_SIZES).toContain(DEFAULT_LOOK.size)
    expect(BLOCK_FONTS).toContain(DEFAULT_LOOK.font)
  })

  it('o tamanho cresce de pequeno para grande', () => {
    expect(BLOCK_SIZE_MM.s).toBeLessThan(BLOCK_SIZE_MM.m)
    expect(BLOCK_SIZE_MM.m).toBeLessThan(BLOCK_SIZE_MM.l)
  })
})
