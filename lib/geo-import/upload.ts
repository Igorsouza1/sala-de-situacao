// Envio de um GeoJSON para o servidor, em lotes, com progresso e desfazer se algo falhar no meio.
// Em lotes porque o corpo de uma requisição na Vercel não passa de uns 4 MB e um arquivo pode ter dezenas de MB.

import type { Feature } from 'geojson'
import type { GeometryKind } from './geojson'

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

/** Grava uma camada raster: uma requisição só (a linha do catálogo e a imagem entram juntas, ou nenhuma). Tenta mais uma vez se falhar. */
export async function saveRasterLayer(input: SaveRasterInput, fetcher: typeof fetch = fetch): Promise<{ slug: string }> {
  const { png, ...meta } = input
  const send = () => {
    const form = new FormData()
    form.set('meta', JSON.stringify(meta))
    form.set('image', png, 'raster.png')
    return fetcher('/api/layers/import/raster', { method: 'POST', body: form })
  }
  let res = await send().catch(() => null)
  if (!res?.ok) res = await send().catch(() => null)
  if (!res) throw new SaveLayerError('A conexão caiu durante o envio.', true)
  if (!res.ok) throw new SaveLayerError(await messageOf(res, 'Não foi possível salvar o raster.'), true)
  return { slug: (await res.json()).data.slug }
}
