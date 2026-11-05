// Envio de um GeoJSON para o servidor, em lotes, com progresso e desfazer se algo falhar no meio.
// Em lotes porque o corpo de uma requisição na Vercel não passa de uns 4 MB e um arquivo pode ter dezenas de MB.

import type { Feature } from 'geojson'
import type { GeometryKind } from './geojson'
import type { SeriesMeta } from './series-meta'

const MAX_BATCH_BYTES = 2_500_000
const MAX_BATCH_FEATURES = 500

/** Corta a lista em lotes que cabem no limite de tamanho do corpo (medido pelo JSON de cada feição) e de quantidade. */
export function chunkFeatures(features: Feature[], maxBytes = MAX_BATCH_BYTES, maxCount = MAX_BATCH_FEATURES): Feature[][] {
  const batches: Feature[][] = []
  let current: Feature[] = []
  let size = 0
  for (const f of features) {
    const bytes = JSON.stringify(f).length
    if (current.length && (size + bytes > maxBytes || current.length >= maxCount)) {
      batches.push(current)
      current = []
      size = 0
    }
    current.push(f)
    size += bytes
  }
  if (current.length) batches.push(current)
  return batches
}

export interface SaveLayerInput {
  name: string
  color: string
  regiaoId: number
  kind: GeometryKind
  dateField?: string
  yearField?: string
  years?: [number, number]
  features: Feature[]
}

export class SaveLayerError extends Error {
  /** o que a tela diz (sem código técnico) */
  constructor(message: string, readonly undone: boolean) {
    super(message)
  }
}

async function messageOf(res: Response, fallback: string): Promise<string> {
  const json = await res.json().catch(() => null)
  return json?.error?.message ?? fallback
}

/**
 * Cria a camada e grava as feições em lotes. Se um lote falha, tenta mais uma vez (DESIGN.md 2.1, regra 6) e, falhando de novo,
 * desfaz tudo o que já entrou, para não sobrar camada pela metade. `onProgress` recebe quantas feições já foram gravadas.
 */
export async function saveGeoJsonLayer(
  input: SaveLayerInput,
  onProgress: (done: number, total: number) => void,
  fetcher: typeof fetch = fetch,
): Promise<{ slug: string }> {
  const { features, ...meta } = input
  const total = features.length
  onProgress(0, total)

  const created = await fetcher('/api/layers/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meta),
  })
  if (!created.ok) throw new SaveLayerError(await messageOf(created, 'Não foi possível criar a camada.'), true)
  const slug: string = (await created.json()).data.slug

  const sendBatch = (batch: Feature[]) =>
    fetcher(`/api/layers/import/${slug}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: batch.map((f) => ({ geometry: f.geometry, properties: f.properties })) }),
    })

  let done = 0
  try {
    for (const batch of chunkFeatures(features)) {
      let res = await sendBatch(batch).catch(() => null)
      if (!res?.ok) res = await sendBatch(batch).catch(() => null)
      if (!res?.ok) throw new SaveLayerError(res ? await messageOf(res, 'Não foi possível gravar o arquivo.') : 'A conexão caiu durante o envio.', false)
      done += batch.length
      onProgress(done, total)
    }
  } catch (e) {
    const undone = await fetcher(`/api/layers/import/${slug}`, { method: 'DELETE' }).then((r) => r.ok).catch(() => false)
    const message = e instanceof Error ? e.message : 'Não foi possível gravar o arquivo.'
    throw new SaveLayerError(message, undone)
  }
  return { slug }
}

export interface SaveRasterInput {
  name: string
  color: string
  regiaoId: number
  mode: 'bandas' | 'valores'
  width: number
  height: number
  bounds: [number, number, number, number]
  bands: number
  firstYear: number | null
  max: number
  /** a imagem empacotada (ver raster-pack.ts) */
  png: Blob
}

/** Uma requisição só, com o resumo e o arquivo juntos (a linha do catálogo e o dado entram juntos, ou nenhum). Tenta mais uma vez se falhar. */
async function sendOnce(url: string, meta: object, field: string, blob: Blob, fileName: string, fallback: string, fetcher: typeof fetch): Promise<{ slug: string }> {
  const send = () => {
    const form = new FormData()
    form.set('meta', JSON.stringify(meta))
    form.set(field, blob, fileName)
    return fetcher(url, { method: 'POST', body: form })
  }
  let res = await send().catch(() => null)
  if (!res?.ok) res = await send().catch(() => null)
  if (!res) throw new SaveLayerError('A conexão caiu durante o envio.', true)
  if (!res.ok) throw new SaveLayerError(await messageOf(res, fallback), true)
  return { slug: (await res.json()).data.slug }
}

/** Grava uma camada raster (fogo por ano ou valores). */
export async function saveRasterLayer(input: SaveRasterInput, fetcher: typeof fetch = fetch): Promise<{ slug: string }> {
  const { png, ...meta } = input
  return sendOnce('/api/layers/import/raster', meta, 'image', png, 'raster.png', 'Não foi possível salvar o raster.', fetcher)
}

export interface SaveSeriesInput extends SeriesMeta {
  /** a série codificada (ver class-series.ts) */
  data: Blob
}

/** Grava uma série de anos de um raster de classes (ex.: uso do solo do MapBiomas). */
export async function saveSeriesLayer(input: SaveSeriesInput, fetcher: typeof fetch = fetch): Promise<{ slug: string }> {
  const { data, ...meta } = input
  return sendOnce('/api/layers/import/raster-series', meta, 'series', data, 'serie.bin', 'Não foi possível salvar a série.', fetcher)
}
