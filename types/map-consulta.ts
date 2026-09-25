import type { Geometry } from 'geojson'

export type ConsultaKind = 'acoes' | 'propriedades'
export type ConsultaBounds = [number, number, number, number]
export interface ConsultaItem {
  id: number
  nome: string
  municipio: string | null
  data: string | null
  categoria: string | null
  car: string | null
  titular: string | null
  area: number | null
  descricao?: string | null
  status?: string | null
  eixo_tematico?: string | null
  tipo_tecnico?: string | null
  carater?: string | null
  geometry?: Geometry | null
  bacias?: string[]
  propriedades?: { id: number; nome: string; municipio: string | null }[]
}
export interface ConsultaPage { items: ConsultaItem[]; hasMore: boolean }
export interface ConsultaSelection { kind: ConsultaKind; id: number }
