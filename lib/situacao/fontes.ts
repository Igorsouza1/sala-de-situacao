// Quais assuntos a Situação mostra numa região, e de onde vem o dado de cada um (DESIGN.md 13.10, "Uma Situação por região").
// Cada assunto aparece só onde há dado: as estações de Bonito não têm sentido na Rede Amolar, e o fogo da Rede Amolar vem de uma
// camada importada (o raster de fogo por mês), não dos focos de satélite. Puro, para o teste: o repositório só lê o banco.

import type { SeriesStats } from '@/lib/geo-import/class-series'

export interface CatalogoLinha {
  slug: string
  name: string
  schemaConfig: unknown
}

/** o que existe no banco para a região: registros ligados a ela (focos, alertas, javali) ou à organização dela (estações) */
export interface Presenca {
  focos: boolean
  desmatamento: boolean
  javali: boolean
  formoso: boolean
  prata: boolean
  cure: boolean
}

export interface FogoMensalFonte {
  slug: string
  nome: string
  years: number[]
  stats: SeriesStats
}

export type DesmatamentoFonte = { tipo: 'tabela' } | { tipo: 'camada'; slug: string; nome: string }

export interface AssuntosDaRegiao {
  focos: boolean
  /** a área queimada por ano e mês (raster de fogo por mês importado); uma por camada */
  fogoMensal: FogoMensalFonte[]
  desmatamento: DesmatamentoFonte | null
  javali: boolean
  formoso: boolean
  prata: boolean
  cure: boolean
}

type Sc = {
  source?: string
  kind?: string
  sourceType?: string
  raster?: { mode?: string; legend?: string; years?: number[]; stats?: SeriesStats }
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Uma camada de polígonos que alguém subiu (arrastando ou pelo admin) com "desmatamento" no nome: os alertas da região. */
export function ehCamadaDeDesmatamento(c: CatalogoLinha): boolean {
  const sc = (c.schemaConfig ?? {}) as Sc
  if (sc.kind === 'raster' || sc.sourceType === 'table') return false
  return /desmat/.test(semAcento(`${c.slug} ${c.name}`))
}

function fogoMensalDe(c: CatalogoLinha): FogoMensalFonte | null {
  const r = ((c.schemaConfig ?? {}) as Sc).raster
  if (r?.mode !== 'classes' || r.legend !== 'meses' || !r.stats || !Array.isArray(r.years) || r.years.length === 0) return null
  if (r.stats.ha.length !== r.years.length) return null
  return { slug: c.slug, nome: c.name.trim(), years: r.years, stats: r.stats }
}

export function assuntosDaRegiao(catalogo: CatalogoLinha[], presenca: Presenca): AssuntosDaRegiao {
  const tem = (slug: string) => catalogo.some((c) => c.slug === slug)
  const camada = catalogo.find(ehCamadaDeDesmatamento)
  return {
    focos: presenca.focos || tem('raw_firms') || tem('firms'),
    fogoMensal: catalogo.map(fogoMensalDe).filter((f): f is FogoMensalFonte => f !== null),
    // a tabela de alertas manda quando existe (é a que recebe alerta novo todo dia); senão, a camada importada
    desmatamento: presenca.desmatamento || tem('desmatamento')
      ? { tipo: 'tabela' }
      : camada
        ? { tipo: 'camada', slug: camada.slug, nome: camada.name.trim() }
        : null,
    javali: presenca.javali,
    formoso: presenca.formoso,
    prata: presenca.prata || tem('deque-de-pedras'),
    cure: presenca.cure || tem('ponte-do-cure'),
  }
}

export const semAssunto = (a: AssuntosDaRegiao) =>
  !a.focos && a.fogoMensal.length === 0 && !a.desmatamento && !a.javali && !a.formoso && !a.prata && !a.cure

// ── Desmatamento de uma camada importada: somado por ano e mês, como a tabela de alertas ─────────────────────────────

/** a data do alerta, pelos nomes que as fontes usam (MapBiomas Alerta: data_deteccao; tabela antiga: detectat) */
const CAMPOS_DATA = ['data_deteccao', 'datadeteccao', 'detectat', 'detected_at', 'data', 'date']
const CAMPOS_ANO = ['ano', 'year', 'detectyear', 'ano_deteccao']
const CAMPOS_AREA = ['area_ha', 'areaha', 'alertha', 'area']

function campo(props: Record<string, unknown>, nomes: string[]): unknown {
  const chaves = Object.keys(props)
  for (const n of nomes) {
    const k = chaves.find((c) => c.toLowerCase() === n)
    if (k !== undefined && props[k] !== null && props[k] !== '') return props[k]
  }
  return undefined
}

function numero(v: unknown): number | null {
  if (v === undefined) return null
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/**
 * Hectares de alerta por ano e mês ({ 2025: [jan, …, dez] }), o mesmo formato de `/api/desmatamento`. A área vem do atributo do
 * alerta e, sem ele, da geometria. Sem data, o ano basta: o alerta entra em janeiro daquele ano (o total do ano fica certo).
 */
export function desmatamentoPorAnoMes(linhas: { properties: Record<string, unknown> | null; haGeom: number | null }[]): Record<number, number[]> {
  const out: Record<number, number[]> = {}
  for (const { properties, haGeom } of linhas) {
    const p = properties ?? {}
    const data = campo(p, CAMPOS_DATA)
    const m = typeof data === 'string' ? /^((?:19|20)\d{2})-(\d{2})/.exec(data.trim()) : null
    const ano = m ? Number(m[1]) : numero(campo(p, CAMPOS_ANO))
    if (ano === null || !Number.isInteger(ano) || ano < 1900 || ano > 2100) continue
    const mes = m ? Math.min(11, Math.max(0, Number(m[2]) - 1)) : 0
    const ha = numero(campo(p, CAMPOS_AREA)) ?? haGeom ?? 0
    if (!(ha > 0)) continue
    ;(out[ano] ??= Array(12).fill(0))[mes] += ha
  }
  return out
}
