'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConsultaItem, ConsultaPage } from '@/types/map-consulta'
import { GENERIC_LIST_ERROR, describeFailure } from './helpers/network'

export function useConsultaList(params: string, enabled = true) {
  const [items, setItems] = useState<ConsultaItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  // o aparelho não falou com o servidor: a tela diz "sem conexão" em vez de uma frase técnica (2.1)
  const [offline, setOffline] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const currentParams = useRef(params)
  const busy = useRef(false)

  async function load(offset: number) {
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    busy.current = true
    setLoading(true)
    setError(null)
    setOffline(false)
    try {
      const response = await fetch(`/api/map/consulta?${currentParams.current}&offset=${offset}`, { signal: abort.signal })
      const data: ConsultaPage & { error?: string } = await response.json()
      if (!response.ok) throw new Error(data.error || GENERIC_LIST_ERROR)
      if (abort.signal.aborted) return
      setItems(previous => offset ? [...previous, ...data.items] : data.items)
      setHasMore(data.hasMore)
    } catch (cause) {
      if (abort.signal.aborted) return
      const failure = describeFailure(cause)
      setOffline(failure.offline)
      setError(failure.message ?? GENERIC_LIST_ERROR)
    } finally {
      if (!abort.signal.aborted) { setLoading(false); busy.current = false }
    }
  }
  useEffect(() => {
    currentParams.current = params
    setItems([])
    setHasMore(false)
    // desligada (o registro aberto não é uma propriedade): não busca nada
    if (!enabled) { setLoading(false); return }
    void load(0)
    return () => controller.current?.abort()
  }, [params, enabled])

  // Quando a internet volta, tenta de novo UMA vez, sozinho (2.1, regra 6): quem estava sem conexão não precisa lembrar de tocar em nada.
  const retryRef = useRef<() => void>(() => {})
  retryRef.current = () => void load(items.length)
  useEffect(() => {
    if (!offline) return
    const back = () => retryRef.current()
    window.addEventListener('online', back, { once: true })
    return () => window.removeEventListener('online', back)
  }, [offline])

  return { items, hasMore, loading, error, offline, loadMore: () => { if (!busy.current) void load(items.length) }, retry: () => void load(items.length), reload: () => void load(0) }
}
