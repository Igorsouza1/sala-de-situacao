import { chooseLayout, createLayoutSync, layoutCache, type CacheEntry, type ServerLayout, type SyncDeps, type SyncStatus } from '../helpers/layout-sync'
import type { MapLayout } from '../helpers/layer-layout'

const layoutOf = (...slugs: string[]): MapLayout => ({ v: 1, items: slugs.map((slug) => ({ kind: 'layer' as const, slug })) })
const A = layoutOf('a')
const B = layoutOf('b')
const C = layoutOf('c')

describe('chooseLayout', () => {
  const clean = (layout: MapLayout, at = 10): CacheEntry => ({ layout, at, dirty: false })
  const ok = (layout: MapLayout | null, updatedAt: number | null = 20): ServerLayout => ({ kind: 'ok', layout, updatedAt })

  it('mudança que a conta ainda não viu sempre vence, e sobe', () => {
    expect(chooseLayout({ ...clean(A), dirty: true }, ok(B))).toEqual({ layout: A, push: true })
  })

  it('sem mudança pendente, vale a da conta', () => {
    expect(chooseLayout(clean(A), ok(B))).toEqual({ layout: B, push: false })
    expect(chooseLayout(null, ok(B))).toEqual({ layout: B, push: false })
  })

  it('conta vazia depois de já ter sincronizado: voltou ao padrão em outro aparelho', () => {
    expect(chooseLayout(clean(A), ok(null, null))).toEqual({ layout: undefined, push: false })
  })

  it('sem conta, vale o aparelho', () => {
    expect(chooseLayout(clean(A), { kind: 'unavailable' })).toEqual({ layout: A, push: false })
    expect(chooseLayout(null, { kind: 'unavailable' })).toEqual({ layout: undefined, push: false })
  })
})

describe('layoutCache', () => {
  const memory = () => {
    const data = new Map<string, string>()
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k), data }
  }

  it('guarda e lê, por região', () => {
    const store = memory()
    layoutCache(1, store).write({ layout: A, at: 5, dirty: true })
    expect(layoutCache(1, store).read()).toEqual({ layout: A, at: 5, dirty: true })
    expect(layoutCache(2, store).read()).toBeNull()
    expect([...store.data.keys()]).toEqual(['prisma:mapa:layout:1'])
  })

  it('valor estranho ou estragado vira "sem cache", nunca um erro', () => {
    const store = memory()
    store.setItem('prisma:mapa:layout:padrao', '{não é json')
    expect(layoutCache(undefined, store).read()).toBeNull()
    store.setItem('prisma:mapa:layout:padrao', JSON.stringify({ v: 9 }))
    expect(layoutCache(undefined, store).read()).toBeNull()
  })

  it('sem armazenamento nada quebra', () => {
    const cache = layoutCache(1, null)
    expect(cache.read()).toBeNull()
    expect(() => { cache.write({ layout: A, at: 1, dirty: false }); cache.clear() }).not.toThrow()
  })
})

describe('createLayoutSync', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  function setup(opts: { cache?: CacheEntry | null; server?: ServerLayout | Error; saveFails?: number } = {}) {
    let stored: CacheEntry | null = opts.cache ?? null
    let failures = opts.saveFails ?? 0
    let clock = 1000
    const statuses: SyncStatus[] = []
    const layouts: (MapLayout | undefined)[] = []
    const saved: MapLayout[] = []
    const removed: number[] = []
    const deps: SyncDeps = {
      cache: { read: () => stored, write: (e) => { stored = e }, clear: () => { stored = null } },
      api: {
        load: async () => {
          if (opts.server instanceof Error) throw opts.server
          return opts.server ?? { kind: 'ok', layout: null, updatedAt: null }
        },
        save: async (layout) => {
          if (failures > 0) { failures--; throw new Error('rede') }
          saved.push(layout)
          clock += 100
          return { updatedAt: clock }
        },
        remove: async () => { removed.push(clock) },
      },
      now: () => clock,
      delay: 500,
      retryAfter: 5000,
      onStatus: (s) => statuses.push(s),
      onLayout: (l) => layouts.push(l),
    }
    return { sync: createLayoutSync(deps), statuses, layouts, saved, removed, cache: () => stored }
  }

  it('abre na hora com o cache e depois adota a conta, se ela tem outra', async () => {
    const t = setup({ cache: { layout: A, at: 1, dirty: false }, server: { kind: 'ok', layout: B, updatedAt: 50 } })
    await t.sync.start()
    expect(t.layouts).toEqual([A, B])
    expect(t.cache()).toEqual({ layout: B, at: 50, dirty: false })
  })

  it('agrupa vários arrastos numa gravação só, com a versão mais nova', async () => {
    const t = setup()
    await t.sync.start()
    t.sync.set(A)
    t.sync.set(B)
    t.sync.set(C)
    expect(t.cache()).toMatchObject({ layout: C, dirty: true })
    expect(t.statuses.at(-1)).toEqual({ kind: 'saving' })
    await jest.advanceTimersByTimeAsync(500)
    expect(t.saved).toEqual([C])
    expect(t.statuses.at(-1)).toEqual({ kind: 'saved' })
    expect(t.cache()).toMatchObject({ layout: C, dirty: false })
  })

  it('mudança que ficou pendente no aparelho sobe ao abrir', async () => {
    const t = setup({ cache: { layout: A, at: 1, dirty: true }, server: { kind: 'ok', layout: B, updatedAt: 99 } })
    await t.sync.start()
    await jest.advanceTimersByTimeAsync(0)
    expect(t.saved).toEqual([A])
    expect(t.layouts.at(-1)).toEqual(A)
  })

  it('a primeira falha tenta sozinha uma vez, com a hora da nova tentativa à vista', async () => {
    const t = setup({ saveFails: 1 })
    await t.sync.start()
    t.sync.set(A)
    await jest.advanceTimersByTimeAsync(500)
    expect(t.statuses.at(-1)).toEqual({ kind: 'retrying', at: 1000 + 5000 })
    expect(t.cache()).toMatchObject({ layout: A, dirty: true })
    await jest.advanceTimersByTimeAsync(5000)
    expect(t.saved).toEqual([A])
    expect(t.statuses.at(-1)).toEqual({ kind: 'saved' })
  })

  it('a segunda falha devolve a decisão à pessoa, e "tentar de novo" sobe o que ficou', async () => {
    const t = setup({ saveFails: 2 })
    await t.sync.start()
    t.sync.set(A)
    await jest.advanceTimersByTimeAsync(500 + 5000)
    expect(t.statuses.at(-1)).toEqual({ kind: 'error' })
    expect(t.cache()).toMatchObject({ layout: A, dirty: true })
    t.sync.retry()
    await jest.advanceTimersByTimeAsync(0)
    expect(t.saved).toEqual([A])
    expect(t.statuses.at(-1)).toEqual({ kind: 'saved' })
  })

  it('mexer de novo durante a espera cancela a nova tentativa e junta tudo', async () => {
    const t = setup({ saveFails: 1 })
    await t.sync.start()
    t.sync.set(A)
    await jest.advanceTimersByTimeAsync(500)
    t.sync.set(B)
    await jest.advanceTimersByTimeAsync(500)
    expect(t.saved).toEqual([B])
  })

  it('sem conta (sem região) vale só o aparelho, e diz isso', async () => {
    const t = setup({ server: { kind: 'unavailable' } })
    await t.sync.start()
    expect(t.statuses.at(-1)).toEqual({ kind: 'local' })
    t.sync.set(A)
    await jest.advanceTimersByTimeAsync(2000)
    expect(t.saved).toEqual([])
    expect(t.cache()).toMatchObject({ layout: A })
    expect(t.statuses.at(-1)).toEqual({ kind: 'local' })
  })

  it('sem rede ao abrir, o aparelho segue com o que tem', async () => {
    const t = setup({ cache: { layout: A, at: 1, dirty: false }, server: new Error('rede') })
    await t.sync.start()
    expect(t.layouts).toEqual([A])
  })

  it('"voltar ao padrão" apaga aqui e na conta, e nada que estava a caminho volta', async () => {
    const t = setup()
    await t.sync.start()
    t.sync.set(A)
    await t.sync.reset()
    await jest.advanceTimersByTimeAsync(2000)
    expect(t.removed).toHaveLength(1)
    expect(t.saved).toEqual([])
    expect(t.cache()).toBeNull()
    expect(t.layouts.at(-1)).toBeUndefined()
    expect(t.statuses.at(-1)).toEqual({ kind: 'saved' })
  })

  it('depois de descartado, não grava nem avisa mais ninguém', async () => {
    const t = setup()
    await t.sync.start()
    t.sync.set(A)
    t.sync.dispose()
    const before = t.statuses.length
    await jest.advanceTimersByTimeAsync(2000)
    expect(t.saved).toEqual([])
    expect(t.statuses).toHaveLength(before)
  })
})
