"use client"

import { useEffect, useState } from "react"
import { Layer, useMap, type LayerProps } from "react-map-gl/maplibre"

// O que cresce de 0 até o valor da camada, por tipo. A opacidade sozinha quase não se vê (as áreas ficam em ~0,2),
// então o contorno também "se desenha" (espessura) e os pontos crescem (raio), como os ícones crescem em escala.
const ANIMADOS = {
  fill: ["fill-opacity"],
  line: ["line-opacity", "line-width"],
  circle: ["circle-opacity", "circle-radius", "circle-stroke-width"],
} as const
const DURACAO = 800

// Camada de áreas, linhas ou pontos que ENTRA no mapa (DESIGN.md 8.1: o que entra cresce, nada brota). Os ícones já entram com mola;
// sem isto as áreas apareciam secas ao lado deles. Nasce em 0 e, quando o MapLibre já a desenhou, sobe até o valor da camada.
// O MapLibre só anima mudança de propriedade, não a criação da camada: por isso esperamos a camada existir no mapa.
export function FadeLayer(props: LayerProps) {
  const camada = props as any
  const { current: mapa } = useMap()
  const props_ = ANIMADOS[props.type as keyof typeof ANIMADOS]
  const paint = (camada.paint ?? {}) as Record<string, unknown>
  // só anima o que é número; expressão (dado por feição) fica como está
  const numericas = (props_ ?? []).filter((p) => typeof paint[p] === "number")
  const anima = numericas.length > 0 && !reduzMovimento()
  const [entrou, setEntrou] = useState(!anima)

  useEffect(() => {
    if (!anima || entrou) return
    let frame = 0
    let tentativas = 0
    const esperar = () => {
      const pronta = !!mapa?.getMap().getLayer(props.id as string)
      if (pronta || ++tentativas > 180) {
        // dois quadros com a camada já desenhada em 0, para o MapLibre ter um ponto de partida
        frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => setEntrou(true)) })
      } else frame = requestAnimationFrame(esperar)
    }
    frame = requestAnimationFrame(esperar)
    return () => cancelAnimationFrame(frame)
  }, [anima, entrou, mapa, props.id])

  if (!anima) return <Layer {...props} />
  const animado: Record<string, unknown> = {}
  for (const p of numericas) {
    animado[p] = entrou ? paint[p] : 0
    animado[`${p}-transition`] = { duration: DURACAO, delay: 0 }
  }
  return <Layer {...camada} paint={{ ...paint, ...animado }} />
}

function reduzMovimento() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}
