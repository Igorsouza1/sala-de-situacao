// Fogo por mês (ex.: MapBiomas Fogo mensal): um raster com uma banda por ano, e em cada pixel o MÊS em que queimou (1 a 12; 0 = não
// queimou). Aqui: os nomes dos meses, como reconhecer esse raster pelos valores e como ler o resumo .csv que costuma vir junto, para
// conferir se a área que o mapa calcula bate com a de quem gerou o arquivo. Puro, para o teste.

export const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/**
 * Os valores de um raster de várias bandas são meses (todos de 1 a 12, sem contar o 0 e o "sem dado", e algum além do 1)?
 * Só o 1 é o raster de fogo de antes (0/1 por ano: queimou ou não), que segue o caminho dele.
 */
export function looksLikeMonths(codes: number[]): boolean {
  return codes.some((c) => c > 1) && codes.every((c) => Number.isInteger(c) && c >= 1 && c <= 12)
}

/** O resumo por ano (hectares), de um .csv "ano;jan;fev;…;dez;total_ha" (aceita "," ou ";" e decimal com ponto ou vírgula). */
export function parseMonthlySummary(text: string): Map<number, number> | null {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) return null
  const sep = lines[0].includes(';') ? ';' : ','
  const head = lines[0].split(sep).map((h) => h.trim().toLowerCase())
  const yearCol = head.indexOf('ano')
  const monthCols = MONTH_SHORT.map((m) => head.indexOf(m))
  if (yearCol < 0 || monthCols.some((c) => c < 0)) return null
  const num = (s: string | undefined) => Number((s ?? '').trim().replace(sep === ';' ? ',' : '\u0000', '.'))
  const out = new Map<number, number>()
  for (const line of lines.slice(1)) {
    const cells = line.split(sep)
    const year = Number(cells[yearCol])
    if (!Number.isInteger(year)) continue
    const total = monthCols.reduce((s, c) => s + (Number.isFinite(num(cells[c])) ? num(cells[c]) : 0), 0)
    out.set(year, total)
  }
  return out.size ? out : null
}

export interface SummaryCheck {
  /** os anos em que a área calculada passa de 2% (e de 5 ha) da do resumo */
  differ: number[]
  /** os anos que existem nos dois */
  compared: number
}

/** Compara a área calculada (ha por ano) com a do resumo. Diferença pequena é normal (arredondamento, projeção da área). */
export function compareSummary(computed: Map<number, number>, summary: Map<number, number>): SummaryCheck {
  const differ: number[] = []
  let compared = 0
  for (const [year, expected] of summary) {
    const got = computed.get(year)
    if (got === undefined) continue
    compared++
    const diff = Math.abs(got - expected)
    if (diff > 5 && diff > expected * 0.02) differ.push(year)
  }
  return { differ, compared }
}

/** a cor de fogo do projeto (DESIGN.md 4.2, "crítico, fogo"), em RGB: o mapa pinta o pixel queimado com ela */
const FIRE_RGB: [number, number, number] = [0xc8, 0x43, 0x1a]

/**
 * A tabela de cores do fogo por mês: o pixel que queimou no ano (1 a 12) fica na cor de fogo; com `month`, só o daquele mês.
 * Não queimou (0), outro mês ou valor fora de 1 a 12: transparente. RGBA de verdade, como o canvas lê.
 */
export function monthLut(month: number | null): Uint32Array {
  const lut = new Uint32Array(256)
  const [r, g, b] = FIRE_RGB
  const fire = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
  for (let c = 1; c <= 12; c++) if (month === null || c === month) lut[c] = fire
  return lut
}
