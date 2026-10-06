'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Novidades } from '@/types/map-novidades'
import { newsItems, readSeen, totalNews, writeSeen, type SeenMarker } from './helpers/novidades'

// "O que mudou desde que eu estive aqui" (DESIGN.md 13.8). Ao abrir o mapa, compara com o ponto de partida guardado por região no navegador.
//  - Primeira visita: não há de onde comparar, então guarda o ponto de partida e o sino começa vazio (nunca mostra tudo como "novo").
//  - Depois: o sino conta o que chegou desde então. Abrir a lista marca como visto (o ponto de partida avança); a lista aberta continua
//    mostrando o que a pessoa veio ler, e some quando ela a fecha. Abrir o mapa NÃO marca nada: a novidade nunca some sem ter sido lida.
// Enquanto o mapa fica aberto, confere de novo a cada 5 minutos (e quando a aba volta a ser vista), porque a sala de situação fica aberta o dia todo.

const RECHECK_MS = 5 * 60 * 1000

export function useNovidades(regiaoId?: number) {
  const [news, setNews] = useState<Novidades | null>(null)
  const [since, setSince] = useState<string | null>(null)
  const [read, setRead] = useState(false)
  const marker = useRef<SeenMarker | null>(null)

  const check = useCallback(async () => {
    const seen = readSeen(regiaoId)
    marker.current = seen
    const params = new URLSearchParams()
    if (regiaoId) params.set('regiao_id', String(regiaoId))
    if (seen) { params.set('since', seen.at); params.set('acoes_after', String(seen.acoes)) }
    try {
      const res = await fetch(`/api/map/novidades?${params}`)
      if (!res.ok) return
      const data: Novidades = await res.json()
      if (!seen) {
        // primeira visita: guarda de onde partir e não mostra nada
        writeSeen(regiaoId, { at: data.now, acoes: data.acoesMaxId })
        marker.current = { at: data.now, acoes: data.acoesMaxId }
        setNews(null)
        setSince(null)
        return
      }
      setNews(data)
      setSince(seen.at)
      setRead(false)
    } catch {
      // sem rede ou erro: o sino fica como estava; a próxima conferência tenta de novo
    }
  }, [regiaoId])

  useEffect(() => {
    setNews(null)
    setSince(null)
    setRead(false)
    void check()
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void check() }, RECHECK_MS)
    const onVisible = () => { if (document.visibilityState === 'visible') void check() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible) }
  }, [check])

  const items = useMemo(() => newsItems(news), [news])
  const total = totalNews(items)

  /** a pessoa abriu a lista: o ponto de partida avança, e o sino zera (a lista aberta segue mostrando o que veio ler) */
  const markSeen = useCallback(() => {
    if (!news) return
    writeSeen(regiaoId, { at: news.now, acoes: news.acoesMaxId })
    marker.current = { at: news.now, acoes: news.acoesMaxId }
    setRead(true)
  }, [news, regiaoId])

  /** a pessoa fechou a lista: o que ela já leu sai */
  const dismiss = useCallback(() => {
    if (read) { setNews(null); setSince(null) }
  }, [read])

  return { items, total, unread: read ? 0 : total, since, markSeen, dismiss }
}
