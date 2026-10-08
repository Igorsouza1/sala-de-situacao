'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConsultaItem, ConsultaSelection } from '@/types/map-consulta'
import { GENERIC_OPEN_ERROR, describeFailure } from './helpers/network'

// O registro aberto no painel Explorar. O que já foi aberto fica guardado: voltar a um registro não busca de novo.
// `onLoaded` avisa quando o registro chega (o mapa se move até ele); fica numa ref para não refazer a busca se a função mudar.
export function useConsultaDetail(selection: ConsultaSelection | null, regiaoId: number | undefined, onLoaded: (item: ConsultaItem) => void) {
  const [item, setItem] = useState<ConsultaItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const cache = useRef(new Map<string, ConsultaItem>())
  const loaded = useRef(onLoaded)
  loaded.current = onLoaded
  const current = useRef(selection)
  current.current = selection

  useEffect(() => {
    setItem(null)
    setError(null)
    setOffline(false)
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
        if (!response.ok) throw new Error(data.error || GENERIC_OPEN_ERROR)
        if (abort.signal.aborted) return
        const found: ConsultaItem = data.items[0]
        cache.current.set(key, found)
        setItem(found)
        loaded.current(found)
      })
      .catch((cause) => {
        if (abort.signal.aborted) return
        const failure = describeFailure(cause)
        setOffline(failure.offline)
        setError(failure.message ?? GENERIC_OPEN_ERROR)
      })
    return () => abort.abort()
  }, [selection?.kind, selection?.id, regiaoId, attempt])

  // Quando a internet volta, tenta de novo UMA vez, sozinho (2.1, regra 6)
  useEffect(() => {
    if (!offline) return
    const back = () => setAttempt((n) => n + 1)
    window.addEventListener('online', back, { once: true })
    return () => window.removeEventListener('online', back)
  }, [offline])

  // depois de salvar, o registro novo vale na hora e fica guardado no lugar do antigo. Lê a seleção de agora (e não a de quando
  // foi chamado): o "Desfazer" chega até 10 s depois, quando a pessoa pode já ter aberto outro registro.
  const replace = (kind: ConsultaSelection['kind'], next: ConsultaItem) => {
    cache.current.set(`${kind}:${next.id}`, next)
    if (current.current?.kind === kind && current.current.id === next.id) setItem(next)
  }

  return { item, error, offline, retry: () => setAttempt((n) => n + 1), replace }
}
