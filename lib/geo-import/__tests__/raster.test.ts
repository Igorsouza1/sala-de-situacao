import { firstYearFromName, packBands, packValues } from '../raster-pack'
import { hexToRgb, mercatorRowMap, paintRaster, shade } from '../raster-paint'

const A = (v: number) => v >>> 24
const R = (v: number) => v & 255

describe('packBands', () => {
  it('guarda um bit por ano e marca o "sem dado" com alfa 0', () => {
    // 3 pixels, 3 anos. px0 queimou em 2004 e 2006; px1 nunca; px2 sem dado
    const bands = [[1, 0, 255], [0, 0, 255], [1, 0, 255]]
    const out = new Uint32Array(3)
    const r = packBands(bands, 3, 255, out, 0)
    expect(r.nonBinary).toBe(false)
    expect(A(out[0])).toBe(255)
    expect(R(out[0])).toBe(0b101)
    expect(A(out[1])).toBe(255)
    expect(R(out[1])).toBe(0)
    expect(A(out[2])).toBe(0)
  })

  it('usa mais de um byte quando passa de 8 anos', () => {
    const bands = Array.from({ length: 12 }, (_, b) => [b === 9 ? 1 : 0])
    const out = new Uint32Array(1)
    packBands(bands, 1, 255, out, 0)
    expect((out[0] >>> 8) & 255).toBe(0b10) // bit 9 = bit 1 do verde
  })

  it('avisa quando uma banda anual tem valor que não é 0 nem 1', () => {
    const out = new Uint32Array(1)
    expect(packBands([[3]], 1, 255, out, 0).nonBinary).toBe(true)
  })

  it('respeita o deslocamento (a imagem é montada por janelas de linhas)', () => {
    const out = new Uint32Array(4)
    packBands([[1, 1]], 2, null, out, 2)
    expect(out[0]).toBe(0)
    expect(R(out[2])).toBe(1)
  })
})

describe('packValues', () => {
  it('guarda o valor e devolve o maior', () => {
    const out = new Uint32Array(3)
    const r = packValues([0, 7, 255], 3, 255, out, 0)
    expect(r.max).toBe(7)
    expect(R(out[1])).toBe(7)
    expect(A(out[2])).toBe(0)
  })
})

describe('firstYearFromName', () => {
  it('lê o período do nome quando bate com o número de bandas', () => {
    expect(firstYearFromName('fogo_mapbiomas_buffer10km_2004_2025_por_ano.tif', 22)).toBe(2004)
  })
  it('não chuta quando não bate', () => {
    expect(firstYearFromName('fogo_2004_2025.tif', 10)).toBeNull()
    expect(firstYearFromName('fogo.tif', 22)).toBeNull()
  })
})

describe('paintRaster', () => {
  const bounds: [number, number, number, number] = [-57, -18, -56, -17]
  const red: [number, number, number] = [255, 0, 0]

  it('pinta só o período pedido e conta quantas vezes', () => {
    // 1 linha x 3 colunas, 4 anos: px0 queimou no ano 0; px1 nos anos 1 e 2; px2 nunca
    const src = new Uint32Array([((255 << 24) | 0b0001) >>> 0, ((255 << 24) | 0b0110) >>> 0, (255 << 24) >>> 0])
    const dest = new Uint32Array(3)
    paintRaster(src, dest, 3, 1, bounds, { mode: 'bandas', rgb: red, from: 1, to: 2 })
    expect(dest[0]).toBe(0) // o ano 0 está fora do período
    expect(A(dest[1])).toBe(255) // queimou duas vezes no período
    expect(dest[2]).toBe(0)

    const all = new Uint32Array(3)
    paintRaster(src, all, 3, 1, bounds, { mode: 'bandas', rgb: red, from: 0, to: 3 })
    expect(A(all[0])).toBe(255)
    // quem queimou duas vezes é mais escuro (mais cheio) que quem queimou uma
    const g = (v: number) => (v >>> 8) & 255
    expect(g(all[1])).toBeLessThan(g(all[0]))
  })

  it('um ano só usa a cor cheia', () => {
    const src = new Uint32Array([((255 << 24) | 0b0001) >>> 0])
    const dest = new Uint32Array(1)
    paintRaster(src, dest, 1, 1, bounds, { mode: 'bandas', rgb: red, from: 0, to: 0 })
    expect(dest[0]).toBe(((255 << 24) | 255) >>> 0)
  })

  it('deixa o "sem dado" transparente', () => {
    const dest = new Uint32Array([123])
    paintRaster(new Uint32Array([0]), dest, 1, 1, bounds, { mode: 'bandas', rgb: red, from: 0, to: 3 })
    expect(dest[0]).toBe(0)
  })

  it('modo valores: 0 some e o maior valor é o mais cheio', () => {
    const src = new Uint32Array([((255 << 24) | 0) >>> 0, ((255 << 24) | 1) >>> 0, ((255 << 24) | 13) >>> 0])
    const dest = new Uint32Array(3)
    paintRaster(src, dest, 3, 1, bounds, { mode: 'valores', rgb: red, max: 13 })
    expect(dest[0]).toBe(0)
    expect(A(dest[1])).toBe(255)
    expect((dest[2] >>> 8) & 255).toBeLessThan((dest[1] >>> 8) & 255)
  })
})

describe('mercatorRowMap', () => {
  it('cobre o raster de cima a baixo, sem pular para trás', () => {
    const map = mercatorRowMap(100, [-57, -18.7, -56, -17.3])
    expect(map[0]).toBeLessThanOrEqual(1)
    expect(map[99]).toBeGreaterThanOrEqual(98)
    for (let i = 1; i < map.length; i++) expect(map[i]).toBeGreaterThanOrEqual(map[i - 1])
  })

  it('corrige a deriva: no meio, a linha de origem não é a do meio', () => {
    const map = mercatorRowMap(1000, [-57, -18.7, -56, -17.3])
    // sem correção seria 500; em Mercator o meio fica uns 2 a 3 pixels acima do centro em latitude
    expect(map[500]).not.toBe(500)
    expect(Math.abs(map[500] - 500)).toBeLessThan(10)
  })
})

describe('cores', () => {
  it('hexToRgb lê #rgb e #rrggbb', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0])
    expect(hexToRgb('#f00')).toEqual([255, 0, 0])
  })
  it('shade vai do claro ao cheio', () => {
    expect(shade([255, 0, 0], 1, 5)[1]).toBeGreaterThan(shade([255, 0, 0], 5, 5)[1])
    expect(shade([255, 0, 0], 5, 5)).toEqual([255, 0, 0])
  })
})
