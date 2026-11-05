import { deltaFrame, rowAreasHa, type Grid } from '@/lib/geo-import/class-series'
import { mascaraDoPoligono, SomaNoRecorte } from '../recorte-raster'

// grade 4×4 de 1 grau: o pixel (coluna i, linha j) tem centro em (i + 0,5 ; 3,5 − j)
const grade: Grid = { width: 4, height: 4, bounds: [0, 0, 4, 4] }
const quadrado = (x0: number, y0: number, x1: number, y1: number) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]

describe('mascaraDoPoligono', () => {
  it('pega os pixels cujo centro cai dentro', () => {
    expect([...mascaraDoPoligono(grade, { type: 'Polygon', coordinates: [quadrado(1, 1, 3, 3)] })]).toEqual([5, 6, 9, 10])
  })
  it('respeita o furo', () => {
    const m = mascaraDoPoligono(grade, { type: 'Polygon', coordinates: [quadrado(0, 0, 4, 4), quadrado(1, 1, 3, 3)] })
    expect(m.length).toBe(12)
    expect([...m]).not.toContain(5)
  })
  it('junta as partes de um multipolígono, em ordem', () => {
    const m = mascaraDoPoligono(grade, { type: 'MultiPolygon', coordinates: [[quadrado(3, 3, 4, 4)], [quadrado(0, 0, 1, 1)]] })
    expect([...m]).toEqual([3, 12])
  })
  it('polígono fora da grade não pega nada; o que passa da borda é cortado', () => {
    expect(mascaraDoPoligono(grade, { type: 'Polygon', coordinates: [quadrado(10, 10, 12, 12)] }).length).toBe(0)
    expect(mascaraDoPoligono(grade, { type: 'Polygon', coordinates: [quadrado(-5, -5, 1, 9)] }).length).toBe(4)
  })
})

describe('SomaNoRecorte', () => {
  // dois anos: no primeiro queima o mês 3 em quatro pixels; no segundo muda parte deles
  const ano1 = Uint8Array.from([0, 0, 0, 0, 0, 3, 3, 0, 0, 3, 3, 0, 0, 0, 0, 7])
  const ano2 = Uint8Array.from([0, 0, 0, 0, 0, 8, 0, 0, 0, 3, 3, 0, 0, 0, 0, 7])
  const fluxo = new Uint8Array([...ano1, ...deltaFrame(ano1, ano2)])
  const mascara = mascaraDoPoligono(grade, { type: 'Polygon', coordinates: [quadrado(1, 1, 3, 3)] })
  const linhas = rowAreasHa(grade)

  // a conta direta, quadro inteiro, para comparar
  function direto(quadro: Uint8Array, classes: number[]) {
    return classes.map((c) => [...mascara].reduce((s, idx) => s + (quadro[idx] === c ? linhas[Math.floor(idx / 4)] : 0), 0))
  }

  it.each([1, 3, 7, 32])('dá a mesma área da conta direta, lendo em pedaços de %i bytes', (tam) => {
    const soma = new SomaNoRecorte(grade, mascara, 2, [3, 7, 8])
    for (let k = 0; k < fluxo.length; k += tam) soma.push(fluxo.subarray(k, k + tam))
    const { classes, ha } = soma.finish()
    expect(classes).toEqual([3, 7, 8])
    const arred = (xs: number[]) => xs.map((x) => Math.round(x * 10) / 10)
    expect(ha[0]).toEqual(arred(direto(ano1, [3, 7, 8])))
    expect(ha[1]).toEqual(arred(direto(ano2, [3, 7, 8])))
    // o pixel do mês 7 fica fora do polígono: não conta
    expect(ha[0][1]).toBe(0)
    expect(ha[1][2]).toBeGreaterThan(0)
  })

  it('série cortada no meio é erro, não um número errado', () => {
    const soma = new SomaNoRecorte(grade, mascara, 2, [3])
    soma.push(fluxo.subarray(0, 20))
    expect(() => soma.finish()).toThrow('incompleta')
  })
})
