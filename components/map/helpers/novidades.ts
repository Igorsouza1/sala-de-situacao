import type { Novidades } from '@/types/map-novidades'

// O que mudou desde que a pessoa esteve aqui (DESIGN.md 13.8): o marcador de "visto", as frases e os itens da lista.

/** até onde a pessoa já viu: o instante (do banco) e o maior id de ação. Guardado por região no navegador, como as preferências (13.2). */
export interface SeenMarker {
  at: string
  acoes: number
}

export const novidadesKey = (regiaoId?: number) => `prisma:mapa:regiao:${regiaoId ?? 'padrao'}:novidades`

export function readSeen(regiaoId?: number): SeenMarker | null {
  try {
    const raw = localStorage.getItem(novidadesKey(regiaoId))
    if (!raw) return null
    const data = JSON.parse(raw)
    // valor estranho (versão antiga, edição à mão) vira "nunca viu", e não um erro
    if (typeof data?.at !== 'string' || Number.isNaN(Date.parse(data.at)) || !Number.isInteger(data?.acoes) || data.acoes < 0) return null
    return { at: data.at, acoes: data.acoes }
  } catch {
    return null
  }
}

export function writeSeen(regiaoId: number | undefined, marker: SeenMarker): void {
  try { localStorage.setItem(novidadesKey(regiaoId), JSON.stringify(marker)) } catch { /* sem armazenamento: vale só nesta visita */ }
}

export type NewsKind = 'focos' | 'desmatamento' | 'acoes'

export interface NewsItem {
  kind: NewsKind
  /** a camada do catálogo onde isso aparece no mapa */
  slug: string
  count: number
  ids: string[]
  phrase: string
}

const SLUG: Record<NewsKind, string> = { focos: 'raw_firms', desmatamento: 'desmatamento', acoes: 'acoes' }

const phrase = (kind: NewsKind, n: number) => {
  if (kind === 'focos') return n === 1 ? '1 foco de calor novo' : `${n} focos de calor novos`
  if (kind === 'desmatamento') return n === 1 ? '1 alerta de desmatamento' : `${n} alertas de desmatamento`
  return n === 1 ? '1 ação nova' : `${n} ações novas`
}

/** só o que tem novidade, na ordem do que mais importa para quem vigia o território: fogo, desmatamento, ações */
export function newsItems(news: Novidades | null): NewsItem[] {
  if (!news) return []
  return (['focos', 'desmatamento', 'acoes'] as const)
    .map((kind) => ({ kind, slug: SLUG[kind], count: news[kind].count, ids: news[kind].ids, phrase: phrase(kind, news[kind].count) }))
    .filter((item) => item.count > 0)
}

export const totalNews = (items: NewsItem[]) => items.reduce((sum, item) => sum + item.count, 0)

/** "02/10 às 14:32": quando foi a última vez, em palavras que não pedem decifrar (2.1) */
export function sinceText(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} às ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
