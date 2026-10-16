'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseLayout, reconcileLayout, type CatalogLayer, type MapLayout } from './helpers/layer-layout'
import { createLayoutSync, layoutCache, type ServerLayout, type SyncDeps, type SyncStatus } from './helpers/layout-sync'

// A organização das camadas da pessoa (pastas, ordem, cor, opacidade), por região (DESIGN.md 13.1 e 13.2).
// Abre na hora com o cache do aparelho, confere com a conta, e grava na conta depois de uma pausa.
// Só se grava depois de a pessoa mexer: abrir no padrão e sair não congela o padrão como se fosse escolha dela.

const SAVE_DELAY = 500
const RETRY_AFTER = 5000

/** A conta, pela rota. 401, 403 e 400 não são falha de rede: dizem que a organização fica só neste aparelho. */
function accountApi(regiaoId: number | undefined): SyncDeps['api'] {
  const qs = regiaoId ? `?regiao_id=${regiaoId}` : ''
  const url = `/api/map/layout${qs}`
  return {
    async load(): Promise<ServerLayout> {
      const res = await fetch(url, { cache: 'no-store' })
      if (res.status === 400 || res.status === 401 || res.status === 403) return { kind: 'unavailable' }
      if (!res.ok) throw new Error(`layout ${res.status}`)
      const json = await res.json()
      if (!json?.available) return { kind: 'unavailable' }
      const layout = parseLayout(json.layout) ?? null
      return { kind: 'ok', layout, updatedAt: layout && typeof json.updatedAt === 'number' ? json.updatedAt : null }
    },
    async save(layout) {
      const res = await fetch('/api/map/layout', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regiao_id: regiaoId, layout }),
      })
      if (!res.ok) throw new Error(`layout ${res.status}`)
      const json = await res.json()
      return { updatedAt: typeof json?.updatedAt === 'number' ? json.updatedAt : Date.now() }
    },
    async remove() {
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) throw new Error(`layout ${res.status}`)
    },
  }
}

export interface LayerLayoutApi {
  /** a organização de agora, já acertada com o catálogo; nulo enquanto o catálogo não chegou */
  layout: MapLayout | null
  /** a pessoa já organizou alguma coisa nesta região (o padrão não conta) */
  custom: boolean
  status: SyncStatus
  /** muda a organização a partir da de agora; devolver a mesma não grava nada */
  update: (change: (layout: MapLayout) => MapLayout) => void
  /** "Voltar ao padrão": esquece aqui e na conta */
  reset: () => void
  retry: () => void
}

export function useLayerLayout(regiaoId: number | undefined, catalog: CatalogLayer[] | null): LayerLayoutApi {
  const [saved, setSaved] = useState<MapLayout | undefined>(undefined)
  const [status, setStatus] = useState<SyncStatus>({ kind: 'idle' })
  const sync = useRef<ReturnType<typeof createLayoutSync> | null>(null)

  useEffect(() => {
    setSaved(undefined)
    setStatus({ kind: 'idle' })
    const instance = createLayoutSync({
      cache: layoutCache(regiaoId),
      api: accountApi(regiaoId),
      now: Date.now,
      delay: SAVE_DELAY,
      retryAfter: RETRY_AFTER,
      onStatus: setStatus,
      onLayout: setSaved,
    })
    sync.current = instance
    void instance.start()
    return () => {
      instance.dispose()
      if (sync.current === instance) sync.current = null
    }
  }, [regiaoId])

  const layout = useMemo(() => (catalog && catalog.length > 0 ? reconcileLayout(saved, catalog) : null), [saved, catalog])
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const update = useCallback((change: (layout: MapLayout) => MapLayout) => {
    const now = layoutRef.current
    if (!now || !sync.current) return
    const next = change(now)
    if (next !== now) sync.current.set(next)
  }, [])

  const reset = useCallback(() => { void sync.current?.reset() }, [])
  const retry = useCallback(() => sync.current?.retry(), [])

  return { layout, custom: saved !== undefined, status, update, reset, retry }
}
