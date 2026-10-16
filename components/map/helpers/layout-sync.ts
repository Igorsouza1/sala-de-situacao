import { parseLayout, type MapLayout } from './layer-layout'

// Como a organização das camadas viaja entre o aparelho e a conta (DESIGN.md 13.2). O aparelho guarda um cache, para o mapa abrir
// na hora e sem piscar o padrão; a conta guarda a verdade, para a organização seguir a pessoa. Vale a última gravação.
// Aqui mora só a conta, sem tela e sem rede de verdade (tudo entra por `Deps`), para ser testada.

export interface CacheEntry {
  layout: MapLayout
  /** quando foi gravada: a hora da conta se já sincronizou, a do aparelho se ainda não */
  at: number
  /** mudou aqui e a conta ainda não sabe */
  dirty: boolean
}

export type ServerLayout =
  /** a conta respondeu; `layout` é null quando a pessoa nunca organizou (ou voltou ao padrão) */
  | { kind: 'ok'; layout: MapLayout | null; updatedAt: number | null }
  /** sem conta ou sem região para guardar: vale só neste aparelho */
  | { kind: 'unavailable' }

export type SyncStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  /** a primeira falha: tenta sozinho uma vez, e a tela mostra a contagem (2.1, regra 6) */
  | { kind: 'retrying'; at: number }
  /** a segunda falha: a decisão volta à pessoa */
  | { kind: 'error' }
  /** só neste aparelho (sem região na conta) */
  | { kind: 'local' }

export interface SyncDeps {
  cache: { read(): CacheEntry | null; write(entry: CacheEntry): void; clear(): void }
  api: {
    load(): Promise<ServerLayout>
    save(layout: MapLayout): Promise<{ updatedAt: number }>
    remove(): Promise<void>
  }
  now(): number
  /** a espera depois da última mudança, para juntar vários arrastos numa gravação só */
  delay: number
  /** a espera antes da nova tentativa automática */
  retryAfter: number
  onStatus(status: SyncStatus): void
  /** o layout que vale agora (undefined: o padrão) */
  onLayout(layout: MapLayout | undefined): void
}

export type Choice = { layout: MapLayout | undefined; push: boolean }

/**
 * Qual das duas cópias vale ao abrir. O que a pessoa mudou aqui e a conta ainda não viu sempre vence (é a última gravação).
 * Sem mudança pendente, vale a da conta; e uma conta sem nada, depois de já ter sincronizado, quer dizer "voltou ao padrão em outro aparelho".
 */
export function chooseLayout(cache: CacheEntry | null, server: ServerLayout): Choice {
  if (server.kind === 'unavailable') return { layout: cache?.layout, push: false }
  if (cache?.dirty) return { layout: cache.layout, push: true }
  if (server.layout) return { layout: server.layout, push: false }
  return { layout: undefined, push: false }
}

export function createLayoutSync(deps: SyncDeps) {
  let current: MapLayout | undefined
  let timer: ReturnType<typeof setTimeout> | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let again = false
  let failedOnce = false
  let disposed = false
  let accountless = false

  const status = (s: SyncStatus) => { if (!disposed) deps.onStatus(s) }
  const clearTimers = () => {
    if (timer) clearTimeout(timer)
    if (retryTimer) clearTimeout(retryTimer)
    timer = retryTimer = null
  }

  let inflight: Promise<void> | null = null

  // Uma gravação por vez. Chegou outra enquanto uma ia: a segunda espera a primeira terminar e sobe a versão mais nova.
  function push(): Promise<void> {
    if (disposed || !current || accountless) return Promise.resolve()
    if (inflight) { again = true; return inflight }
    const layout = current
    inflight = (async () => {
      try {
        const { updatedAt } = await deps.api.save(layout)
        failedOnce = false
        // se a pessoa mexeu enquanto gravava, a cópia do aparelho continua pendente (dirty) e a próxima gravação a leva
        if (current === layout) deps.cache.write({ layout, at: updatedAt, dirty: false })
        if (!again && !timer) status({ kind: 'saved' })
      } catch {
        if (!failedOnce) {
          failedOnce = true
          status({ kind: 'retrying', at: deps.now() + deps.retryAfter })
          retryTimer = setTimeout(() => { retryTimer = null; void push() }, deps.retryAfter)
        } else {
          failedOnce = false
          status({ kind: 'error' })
        }
      } finally {
        inflight = null
        if (again) { again = false; void push() }
      }
    })()
    return inflight
  }

  return {
    /** lê o cache (a tela abre na hora) e depois pergunta à conta qual das duas vale */
    async start() {
      const cache = deps.cache.read()
      current = cache?.layout
      deps.onLayout(current)
      let server: ServerLayout
      try {
        server = await deps.api.load()
      } catch {
        // sem rede: o aparelho segue com o que tem, e uma mudança pendente sobe quando a rede voltar (nova abertura ou nova mudança)
        if (cache?.dirty) status({ kind: 'error' })
        return
      }
      if (disposed) return
      if (server.kind === 'unavailable') { accountless = true; status({ kind: 'local' }); return }
      const choice = chooseLayout(cache, server)
      if (choice.layout !== current) { current = choice.layout; deps.onLayout(current) }
      if (!choice.layout) deps.cache.clear()
      else if (!choice.push) deps.cache.write({ layout: choice.layout, at: server.updatedAt ?? deps.now(), dirty: false })
      if (choice.push) { status({ kind: 'saving' }); void push() }
    },

    /** a pessoa mexeu: o aparelho guarda já, e a conta recebe depois de uma pausa */
    set(layout: MapLayout) {
      current = layout
      deps.onLayout(layout)
      deps.cache.write({ layout, at: deps.now(), dirty: true })
      if (accountless) { status({ kind: 'local' }); return }
      failedOnce = false
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      status({ kind: 'saving' })
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => { timer = null; void push() }, deps.delay)
    },

    /** "Voltar ao padrão": esquece aqui e na conta */
    async reset() {
      clearTimers()
      again = false
      current = undefined
      deps.cache.clear()
      deps.onLayout(undefined)
      if (accountless) { status({ kind: 'local' }); return }
      status({ kind: 'saving' })
      try {
        // uma gravação que já saiu não pode chegar DEPOIS do "voltar ao padrão" e trazer a organização de volta
        await inflight
        await deps.api.remove()
        status({ kind: 'saved' })
      } catch {
        status({ kind: 'error' })
      }
    },

    /** "Tentar de novo" / "Tentar agora" */
    retry() {
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      failedOnce = false
      status({ kind: 'saving' })
      void push()
    },

    dispose() {
      disposed = true
      clearTimers()
    },
  }
}

const KEY_PREFIX = 'prisma:mapa:layout:'
const VERSION = 1
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const browserStore = (): Store | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** O cache no navegador, por região. Valor estranho vira "sem cache", nunca um erro. */
export function layoutCache(regiaoId: number | undefined, store: Store | null = browserStore()): SyncDeps['cache'] {
  const key = `${KEY_PREFIX}${regiaoId ?? 'padrao'}`
  return {
    read() {
      try {
        const raw = store?.getItem(key)
        if (!raw) return null
        const json = JSON.parse(raw)
        if (json?.v !== VERSION || typeof json.at !== 'number' || typeof json.dirty !== 'boolean') return null
        const layout = parseLayout(json.layout)
        return layout ? { layout, at: json.at, dirty: json.dirty } : null
      } catch {
        return null
      }
    },
    write(entry) {
      try {
        store?.setItem(key, JSON.stringify({ v: VERSION, ...entry }))
      } catch {
        /* sem armazenamento (janela privada, cheio): a conta ainda guarda */
      }
    },
    clear() {
      try {
        store?.removeItem(key)
      } catch {
        /* idem */
      }
    },
  }
}
