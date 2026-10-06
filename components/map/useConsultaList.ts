'use client'

import { useEffect, useRef, useState } from 'react'
import type { ConsultaItem, ConsultaPage } from '@/types/map-consulta'

export function useConsultaList(params: string, enabled = true) {
  const [items, setItems] = useState<ConsultaItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
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
    try {
      const response = await fetch(`/api/map/consulta?${currentParams.current}&offset=${offset}`, { signal: abort.signal })
      const data: ConsultaPage & { error?: string } = await response.json()
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar os resultados.')
      if (abort.signal.aborted) return
      setItems(previous => offset ? [...previous, ...data.items] : data.items)
      setHasMore(data.hasMore)
    } catch (cause) {
      if (!abort.signal.aborted) setError(cause instanceof Error ? cause.message : 'Falha de conexão.')
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

  return { items, hasMore, loading, error, loadMore: () => { if (!busy.current) void load(items.length) }, retry: () => void load(items.length) }
}
