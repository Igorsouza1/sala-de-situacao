// Leitura e conferência de um GeoJSON solto no mapa (importação por arrastar e soltar).
// Roda no navegador (prévia) e no servidor (data de cada feição), por isso não depende de nada do React nem do banco.

import bbox from '@turf/bbox'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

export type ImportProblem =
  | { code: 'json-invalido' }
  | { code: 'sem-geometria' }
  | { code: 'projetado' }
  | { code: 'grande-demais'; mb: number }

/** O que a tela diz quando o arquivo não serve: o que houve e o que fazer, sem código técnico (2.1). */
export function problemMessage(p: ImportProblem): string {
  switch (p.code) {
    case 'json-invalido':
      return 'Não conseguimos ler este arquivo. Confira se ele é um GeoJSON e solte de novo.'
    case 'sem-geometria':
      return 'O arquivo não tem nenhuma forma desenhada (ponto, linha ou área). Solte outro arquivo.'
    case 'projetado':
      return 'As coordenadas deste arquivo estão em metros, não em latitude e longitude. Exporte de novo no GPS (WGS 84 ou SIRGAS 2000) e solte aqui.'
    case 'grande-demais':
      return `O arquivo tem ${p.mb} MB e passa do limite de ${MAX_MB} MB. Recorte para a área que importa e solte de novo.`
  }
}

export const MAX_MB = 100

export type GeometryKind = 'area' | 'linha' | 'ponto' | 'misto'

export interface GeoJsonSummary {
  count: number
  kind: GeometryKind
  /** oeste, sul, leste, norte */
  bounds: [number, number, number, number]
  fields: string[]
  /** campo que parece guardar o ano (ex.: "ano") */
  yearField?: string
  /** campo que parece guardar a data (ex.: "data_deteccao") */
  dateField?: string
  /** menor e maior ano encontrados, quando há campo de ano ou de data */
  years?: [number, number]
}

export type GeoJsonReading =
  | { ok: true; collection: FeatureCollection; summary: GeoJsonSummary }
  | { ok: false; problem: ImportProblem }

const AREA = new Set(['Polygon', 'MultiPolygon'])
const LINE = new Set(['LineString', 'MultiLineString'])
const POINT = new Set(['Point', 'MultiPoint'])

function toFeatures(raw: any): Feature[] | null {
  if (!raw || typeof raw !== 'object') return null
  if (raw.type === 'FeatureCollection' && Array.isArray(raw.features)) return raw.features
  if (raw.type === 'Feature') return [raw]
  if (typeof raw.type === 'string' && (raw.coordinates || raw.geometries)) return [{ type: 'Feature', properties: {}, geometry: raw }]
  return null
}

const yearOf = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d{4}$/.test(v.trim()) ? Number(v) : NaN
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : null
}

const dateOf = (v: unknown): Date | null => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(v.trim())) return null
  const d = new Date(v.trim().length === 10 ? `${v.trim()}T12:00:00Z` : v.trim())
  return Number.isNaN(d.getTime()) ? null : d
}

/** Um campo "serve" quando quase todas as feições têm um valor válido nele (aceita alguns buracos). */
function bestField(features: Feature[], fields: string[], names: RegExp, valid: (v: unknown) => boolean): string | undefined {
  const sample = features.slice(0, 500)
  const ranked = fields
    .filter((f) => names.test(f))
    .map((f) => ({ f, hits: sample.filter((ft) => valid(ft.properties?.[f])).length }))
    .filter((c) => c.hits >= Math.max(1, Math.ceil(sample.length * 0.8)))
    .sort((a, b) => b.hits - a.hits)
  return ranked[0]?.f
}

export function readGeoJson(text: string): GeoJsonReading {
  let raw: any
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, problem: { code: 'json-invalido' } }
  }
  const all = toFeatures(raw)
  if (!all) return { ok: false, problem: { code: 'json-invalido' } }

  const features = all.filter((f) => f && f.type === 'Feature' && f.geometry && typeof f.geometry.type === 'string') as Feature<Geometry>[]
  if (!features.length) return { ok: false, problem: { code: 'sem-geometria' } }

  const collection: FeatureCollection = { type: 'FeatureCollection', features }
  const [w, s, e, n] = bbox(collection)
  if (![w, s, e, n].every(Number.isFinite)) return { ok: false, problem: { code: 'sem-geometria' } }
  if (w < -180 || e > 180 || s < -90 || n > 90) return { ok: false, problem: { code: 'projetado' } }

  const types = new Set(features.map((f) => f.geometry.type))
  const kinds = new Set<GeometryKind>()
  for (const t of types) kinds.add(AREA.has(t) ? 'area' : LINE.has(t) ? 'linha' : POINT.has(t) ? 'ponto' : 'misto')
  const kind: GeometryKind = kinds.size === 1 ? [...kinds][0] : 'misto'

  const fields = [...new Set(features.slice(0, 500).flatMap((f) => Object.keys(f.properties ?? {})))]
  const yearField = bestField(features, fields, /(^|_)(ano|year|detectyear)(_|$)/i, (v) => yearOf(v) !== null)
  const dateField = bestField(features, fields, /(data|date|detect)/i, (v) => dateOf(v) !== null)

  let years: [number, number] | undefined
  const years_ = features
    .map((f) => (dateField ? dateOf(f.properties?.[dateField])?.getUTCFullYear() : undefined) ?? (yearField ? yearOf(f.properties?.[yearField]) : null))
    .filter((y): y is number => typeof y === 'number')
  if (years_.length) years = [Math.min(...years_), Math.max(...years_)]

  return {
    ok: true,
    collection,
    summary: { count: features.length, kind, bounds: [w, s, e, n], fields, yearField, dateField, years },
  }
}

/** Quando a feição aconteceu: a data do campo de data, senão 1º de julho do ano (meio do ano), senão agora. */
export function featureDate(props: Record<string, unknown> | null | undefined, fields: { dateField?: string; yearField?: string }, now = new Date()): Date {
  if (fields.dateField) {
    const d = dateOf(props?.[fields.dateField])
    if (d) return d
  }
  if (fields.yearField) {
    const y = yearOf(props?.[fields.yearField])
    if (y) return new Date(Date.UTC(y, 6, 1, 12))
  }
  return now
}
