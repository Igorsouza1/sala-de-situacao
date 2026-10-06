'use client'

import { useEffect, useState } from 'react'
import { overlayInk, type BasemapKey } from './basemaps'

// As cores de um desenho por cima do mapa (a mancha dos grupos, a seleção do Explorar), já resolvidas: o MapLibre não lê var(),
// então os tokens são lidos do CSS na hora de montar. Mudam com a base (claro no satélite, verde nas bases claras: 13.4).
export function useOverlayInk(basemap: BasemapKey) {
  const ink = overlayInk(basemap)
  const [tokens, setTokens] = useState<Record<string, string>>({})
  useEffect(() => {
    const css = getComputedStyle(document.documentElement)
    setTokens(Object.fromEntries([ink.fill, ink.line, ink.casing].map((t) => [t, css.getPropertyValue(t).trim()])))
  }, [ink.fill, ink.line, ink.casing])
  const color = (token: string) => tokens[token] || 'rgb(31, 77, 58)'
  return { fillOpacity: ink.fillOpacity, casingOpacity: ink.casingOpacity, fillColor: color(ink.fill), lineColor: color(ink.line), casingColor: color(ink.casing) }
}
