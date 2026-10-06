'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConsultaItem, ConsultaSelection } from '@/types/map-consulta'

// O registro aberto no painel Explorar. O que já foi aberto fica guardado: voltar a um registro não busca de novo.
// `onLoaded` avisa quando o registro chega (o mapa se move até ele); fica numa ref para não refazer a busca se a função mudar.
export function useConsultaDetail(selection: ConsultaSelection | null, regiaoId: number | undefined, onLoaded: (item: ConsultaItem) => void) {
  const [item, setItem] = useState<ConsultaItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const cache = useRef(new Map<string, ConsultaItem>())
  const loaded = useRef(onLoaded)
  loaded.current = onLoaded

  useEffect(() => {
    setItem(null)
    setError(null)
    if (!selection) return
    const key = `${selection.kind}:${selection.id}`
    const cached = cache.current.get(key)
    if (cached) { setItem(cached); loaded.current(cached); return }
    const abort = new AbortController()
    const search = new URLSearchParams({ kind: selection.kind, id: String(selection.id) })
    if (regiaoId) search.set('regiao_id', String(regiaoId))
    fetch(`/api/map/consulta?${search}`, { signal: abort.signal })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Não foi possível abrir o registro.')
        if (abort.signal.aborted) return
        const found: ConsultaItem = data.items[0]
        cache.current.set(key, found)
        setItem(found)
        loaded.current(found)
      })
      .catch((cause) => { if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Falha de conexão.') })
    return () => abort.abort()
  }, [selection?.kind, selection?.id, regiaoId, attempt])

  return { item, error, retry: () => setAttempt((n) => n + 1) }
}
