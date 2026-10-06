'use client'

import { useCallback, useEffect, useRef } from 'react'
import { ZOOM_SMOOTH_TAU, wheelZoomDelta } from './map-feel'

// A roda do mouse e a pinça do trackpad dão zoom com movimento próprio (DESIGN.md 13.7): cada giro soma a um destino, e o zoom anda
// até ele a cada quadro com alisamento por tempo, mantendo parado o ponto que está sob o mouse. O zoom nativo do MapLibre
// fica desligado (`scrollZoom={false}` no mapa); os outros gestos (arrastar, pinça do toque, duplo clique) seguem os dele.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useSmoothWheelZoom(mapRef: React.RefObject<any>, ready: boolean) {
  const api = useRef<{ zoomBy: (delta: number) => void } | null>(null)
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!ready || !map) return
    const el: HTMLElement = map.getCanvasContainer()
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let target = map.getZoom()
    let current = target
    let around: unknown = null
    let raf = 0
    let prev = 0
    let idle: ReturnType<typeof setTimeout> | null = null

    const tick = (now: number) => {
      const dt = Math.min(now - prev, 64)
      prev = now
      const k = calm ? 1 : 1 - Math.exp(-dt / ZOOM_SMOOTH_TAU)
      current += (target - current) * k
      const done = Math.abs(target - current) < 0.002
      if (done) current = target
      // duration 0 aplica na hora (sem animação própria do MapLibre) e `around` mantém o ponto sob o mouse parado
      map.easeTo({ zoom: current, around, duration: 0, essential: true })
      raf = done ? 0 : requestAnimationFrame(tick)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      // um gesto novo (o anterior terminou) parte do zoom de agora e do ponto sob o mouse; no meio de um gesto o ponto não muda
      if (!raf && !idle) {
        target = map.getZoom()
        current = target
        around = map.unproject([e.clientX - rect.left, e.clientY - rect.top])
      }
      target = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), target + wheelZoomDelta(e)))
      if (idle) clearTimeout(idle)
      idle = setTimeout(() => { idle = null }, 160)
      if (!raf) { prev = performance.now(); raf = requestAnimationFrame(tick) }
    }

    // os botões + e − e as teclas usam o MESMO movimento: um degrau soma ao destino e o mapa desliza até lá, ancorado no centro
    const zoomBy = (delta: number) => {
      if (!raf && !idle) {
        target = map.getZoom()
        current = target
      }
      around = map.getCenter()
      target = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), target + delta))
      if (!raf) { prev = performance.now(); raf = requestAnimationFrame(tick) }
    }
    api.current = { zoomBy }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      api.current = null
      el.removeEventListener('wheel', onWheel)
      if (raf) cancelAnimationFrame(raf)
      if (idle) clearTimeout(idle)
    }
  }, [mapRef, ready])
  return useCallback((delta: number) => api.current?.zoomBy(delta), [])
}
