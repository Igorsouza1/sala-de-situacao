import type { Feature } from 'geojson'
import { chunkFeatures, saveGeoJsonLayer, saveRasterLayer, saveSeriesLayer } from '../upload'
import { seriesMetaSchema } from '../series-meta'

const feature = (i: number, pad = 0): Feature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-57, -18] },
  properties: { i, pad: 'x'.repeat(pad) },
})

const ok = (data: unknown = {}) => Promise.resolve(new Response(JSON.stringify({ success: true, data }), { status: 200 }))
const fail = (message = 'erro do servidor') => Promise.resolve(new Response(JSON.stringify({ success: false, error: { message } }), { status: 500 }))

describe('chunkFeatures', () => {
  it('respeita o limite de quantidade', () => {
    const batches = chunkFeatures(Array.from({ length: 7 }, (_, i) => feature(i)), 1_000_000, 3)
    expect(batches.map((b) => b.length)).toEqual([3, 3, 1])
  })

  it('respeita o limite de tamanho, sem perder nenhuma feição', () => {
    const features = Array.from({ length: 10 }, (_, i) => feature(i, 400))
    const batches = chunkFeatures(features, 1500, 500)
    expect(batches.length).toBeGreaterThan(1)
    expect(batches.flat()).toHaveLength(10)
  })

  it('uma feição maior que o limite vai sozinha, em vez de travar', () => {
    const batches = chunkFeatures([feature(0, 5000), feature(1)], 1000, 500)
    expect(batches.map((b) => b.length)).toEqual([1, 1])
  })
})

describe('saveGeoJsonLayer', () => {
  const input = { name: 'Fogo', color: '#ff0000', regiaoId: 1, kind: 'area' as const, features: Array.from({ length: 5 }, (_, i) => feature(i)) }

  it('cria a camada, envia os lotes e conta o progresso', async () => {
    const calls: string[] = []
    const fetcher = jest.fn((url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${url}`)
      return url === '/api/layers/import' ? ok({ slug: 'fogo-abc' }) : ok({ saved: 5 })
    }) as unknown as typeof fetch
    const progress: number[] = []
    const r = await saveGeoJsonLayer(input, (done) => progress.push(done), fetcher)
    expect(r.slug).toBe('fogo-abc')
    expect(calls).toEqual(['POST /api/layers/import', 'POST /api/layers/import/fogo-abc/features'])
    expect(progress).toEqual([0, 5])
  })

  it('tenta o lote mais uma vez antes de desistir', async () => {
    let batchCalls = 0
    const fetcher = jest.fn((url: string) => {
      if (url === '/api/layers/import') return ok({ slug: 's' })
      batchCalls++
      return batchCalls === 1 ? fail() : ok()
    }) as unknown as typeof fetch
    await expect(saveGeoJsonLayer(input, () => {}, fetcher)).resolves.toEqual({ slug: 's' })
    expect(batchCalls).toBe(2)
  })

  it('desfaz a camada quando o lote falha duas vezes', async () => {
    const calls: string[] = []
    const fetcher = jest.fn((url: string, init?: RequestInit) => {
      calls.push(`${init?.method} ${url}`)
      if (url === '/api/layers/import') return ok({ slug: 's' })
      if (init?.method === 'DELETE') return ok()
      return fail('sem espaço')
    }) as unknown as typeof fetch
    await expect(saveGeoJsonLayer(input, () => {}, fetcher)).rejects.toMatchObject({ message: 'sem espaço', undone: true })
    expect(calls.at(-1)).toBe('DELETE /api/layers/import/s')
  })

  it('não grava nada quando a criação da camada é recusada', async () => {
    const fetcher = jest.fn(() => fail('Dê um nome à camada.')) as unknown as typeof fetch
    await expect(saveGeoJsonLayer(input, () => {}, fetcher)).rejects.toMatchObject({ message: 'Dê um nome à camada.' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('saveRasterLayer', () => {
  const input = {
    name: 'Fogo', color: '#ea580c', regiaoId: 1, mode: 'bandas' as const, width: 2, height: 2,
    bounds: [-57, -18, -56, -17] as [number, number, number, number], bands: 22, firstYear: 2004, max: 1,
    png: new Blob(['x'], { type: 'image/png' }),
  }

  it('envia o resumo e a imagem juntos e devolve a camada criada', async () => {
    let sent: FormData | null = null
    const fetcher = jest.fn((_url: string, init?: RequestInit) => {
      sent = init?.body as FormData
      return ok({ slug: 'fogo-x' })
    }) as unknown as typeof fetch
    await expect(saveRasterLayer(input, fetcher)).resolves.toEqual({ slug: 'fogo-x' })
    expect(JSON.parse(String(sent!.get('meta')))).toMatchObject({ name: 'Fogo', bands: 22, firstYear: 2004 })
    expect(JSON.parse(String(sent!.get('meta')))).not.toHaveProperty('png')
    expect(sent!.get('image')).toBeInstanceOf(Blob)
  })

  it('tenta de novo uma vez e depois diz o que houve', async () => {
    const fetcher = jest.fn(() => fail('Dê um nome à camada.')) as unknown as typeof fetch
    await expect(saveRasterLayer(input, fetcher)).rejects.toMatchObject({ message: 'Dê um nome à camada.' })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})

describe('série de anos', () => {
  const meta = {
    name: 'Uso do solo MapBiomas (BAP)', regiaoId: 1, width: 2, height: 2,
    bounds: [-57, -22, -56, -21] as [number, number, number, number],
    years: [1985, 1986], stats: { classes: [3, 15], ha: [[1, 2], [1.5, 1.5]] }, mapbiomas: true,
  }

  it('envia o resumo e a série juntos, sem a série no resumo', async () => {
    let sent: FormData | null = null
    let url = ''
    const fetcher = jest.fn((u: string, init?: RequestInit) => {
      url = u
      sent = init?.body as FormData
      return ok({ slug: 'uso-x' })
    }) as unknown as typeof fetch
    await expect(saveSeriesLayer({ ...meta, data: new Blob(['x']) }, fetcher)).resolves.toEqual({ slug: 'uso-x' })
    expect(url).toBe('/api/layers/import/raster-series')
    expect(JSON.parse(String(sent!.get('meta')))).toEqual(meta)
    expect(sent!.get('series')).toBeInstanceOf(Blob)
  })

  it('o resumo válido passa', () => {
    expect(seriesMetaSchema.safeParse(meta).success).toBe(true)
  })

  it('recusa anos fora de ordem ou repetidos', () => {
    const r = seriesMetaSchema.safeParse({ ...meta, years: [1986, 1985] })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Os anos da série precisam vir em ordem, sem repetir.')
  })

  it('recusa áreas que não conferem com os anos e as classes', () => {
    expect(seriesMetaSchema.safeParse({ ...meta, stats: { classes: [3, 15], ha: [[1, 2]] } }).success).toBe(false)
    expect(seriesMetaSchema.safeParse({ ...meta, stats: { classes: [3, 15], ha: [[1], [2]] } }).success).toBe(false)
  })

  it('recusa limites que não fecham uma área', () => {
    expect(seriesMetaSchema.safeParse({ ...meta, bounds: [-56, -22, -57, -21] }).success).toBe(false)
  })
})
