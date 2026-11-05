// A área de cada classe de uma série de anos (ex.: fogo por mês) DENTRO de um polígono: o "recorte" da Situação.
//
// A série gravada (class-series.ts) é um fluxo: o primeiro ano inteiro e, dos seguintes, só o que mudou (255 = igual). Aqui o fluxo
// passa uma vez, pedaço a pedaço, e só os pixels de dentro do polígono são lidos: nada do resto da grade fica na memória.
// Puro (sem servidor nem navegador), para valer igual no teste e na rota.

import type { MultiPolygon, Polygon, Position } from 'geojson'
import { OUTSIDE, UNCHANGED, rowAreasHa, type Grid, type SeriesStats } from '@/lib/geo-import/class-series'

/**
 * Os pixels cujo CENTRO cai dentro do polígono (furos e várias partes respeitados, regra par-ímpar), em ordem crescente.
 * Varre linha a linha: cada aresta só visita as linhas que cruza.
 */
export function mascaraDoPoligono(grid: Grid, geometria: Polygon | MultiPolygon): Uint32Array {
  const [w, s, e, n] = grid.bounds
  const dx = (e - w) / grid.width
  const dy = (n - s) / grid.height
  const aneis: Position[][] = geometria.type === 'Polygon' ? geometria.coordinates : geometria.coordinates.flat()
  const cruzamentos: number[][] = Array.from({ length: grid.height }, () => [])

  for (const anel of aneis) {
    for (let k = 0; k < anel.length - 1; k++) {
      const [x1, y1] = anel[k]
      const [x2, y2] = anel[k + 1]
      if (y1 === y2) continue
      // linhas cujo centro (y = n - (j + 0.5)·dy) fica no intervalo meio-aberto da aresta: o vértice compartilhado conta uma vez
      const ymin = Math.min(y1, y2)
      const ymax = Math.max(y1, y2)
      const jIni = Math.max(0, Math.ceil((n - ymax) / dy - 0.5))
      const jFim = Math.min(grid.height - 1, Math.floor((n - ymin) / dy - 0.5))
      for (let j = jIni; j <= jFim; j++) {
        const y = n - (j + 0.5) * dy
        if (y < ymin || y >= ymax) continue
        cruzamentos[j].push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1))
      }
    }
  }

  const out: number[] = []
  for (let j = 0; j < grid.height; j++) {
    const xs = cruzamentos[j]
    if (xs.length < 2) continue
    xs.sort((a, b) => a - b)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      // colunas cujo centro (x = w + (i + 0.5)·dx) fica em [xs[k], xs[k+1])
      const iIni = Math.max(0, Math.ceil((xs[k] - w) / dx - 0.5))
      const iFim = Math.min(grid.width - 1, Math.ceil((xs[k + 1] - w) / dx - 0.5) - 1)
      for (let i = iIni; i <= iFim; i++) out.push(j * grid.width + i)
    }
  }
  return Uint32Array.from(out)
}

/**
 * Soma as áreas por classe e por ano dentro da máscara, lendo o fluxo descomprimido da série em pedaços (`push`).
 * `classes` é a ordem das colunas de `ha` (a mesma das estatísticas da camada); classe fora dela não conta.
 */
export class SomaNoRecorte {
  private readonly pixels: number
  private readonly valores: Uint8Array
  private readonly linhaHa: Float64Array
  private readonly coluna = new Int16Array(256).fill(-1)
  private readonly ha: number[][] = []
  private pos = 0

  constructor(private readonly grid: Grid, private readonly mascara: Uint32Array, private readonly anos: number, private readonly classes: number[]) {
    this.pixels = grid.width * grid.height
    this.valores = new Uint8Array(mascara.length)
    const linhas = rowAreasHa(grid)
    this.linhaHa = Float64Array.from(mascara, (idx) => linhas[Math.floor(idx / grid.width)])
    classes.forEach((c, k) => { this.coluna[c] = k })
  }

  push(pedaco: Uint8Array): void {
    let lido = 0
    while (lido < pedaco.length) {
      const quadro = Math.floor(this.pos / this.pixels)
      if (quadro >= this.anos) throw new Error('série maior que o informado')
      const inicio = this.pos - quadro * this.pixels // posição dentro do quadro
      const n = Math.min(pedaco.length - lido, this.pixels - inicio)
      // só os pixels da máscara que caem neste trecho do quadro
      let p = primeiroAPartir(this.mascara, inicio)
      for (; p < this.mascara.length && this.mascara[p] < inicio + n; p++) {
        const v = pedaco[lido + this.mascara[p] - inicio]
        if (quadro === 0 || v !== UNCHANGED) this.valores[p] = v
      }
      lido += n
      this.pos += n
      if (this.pos % this.pixels === 0) this.fecharAno()
    }
  }

  private fecharAno(): void {
    const linha = new Array<number>(this.classes.length).fill(0)
    for (let p = 0; p < this.valores.length; p++) {
      const v = this.valores[p]
      if (v === OUTSIDE) continue
      const k = this.coluna[v]
      if (k >= 0) linha[k] += this.linhaHa[p]
    }
    this.ha.push(linha.map((x) => Math.round(x * 10) / 10))
  }

  finish(): SeriesStats {
    if (this.pos !== this.pixels * this.anos) throw new Error('série incompleta')
    return { classes: this.classes, ha: this.ha }
  }
}

/** o primeiro índice da máscara (crescente) com pixel >= alvo */
function primeiroAPartir(m: Uint32Array, alvo: number): number {
  let lo = 0
  let hi = m.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (m[mid] < alvo) lo = mid + 1
    else hi = mid
  }
  return lo
}
