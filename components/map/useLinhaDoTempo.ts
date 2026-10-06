'use client'

import { useCallback, useEffect, useState } from 'react'
import type { LinhaDoTempo } from '@/types/map-linha-do-tempo'

// As três séries por mês da região (DESIGN.md 13.9). Busca ao montar e guarda: o painel Filtros fica montado mesmo fechado.
export function useLinhaDoTempo(regiaoId?: number) {
  const [data, setData] = useState<LinhaDoTempo | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const abort = new AbortController()
    setData(null)
    setError(false)
    const params = new URLSearchParams()
    if (regiaoId) params.set('regiao_id', String(regiaoId))
    fetch(`/api/map/linha-do-tempo?${params}`, { signal: abort.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('falhou')
        const json: LinhaDoTempo = await res.json()
        if (!abort.signal.aborted) setData(json)
      })
      .catch(() => { if (!abort.signal.aborted) setError(true) })
    return () => abort.abort()
  }, [regiaoId, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  return { data, error, loading: !data && !error, retry }
}
