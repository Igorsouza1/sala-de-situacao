"use client"

import * as React from "react"

import { Collapse } from "./collapse"

// Um painel que troca de visão sem "piscar" (DESIGN.md 8.4): a visão que sai some em fade enquanto encolhe, a que entra aparece em
// fade enquanto cresce, e a altura do painel acompanha em 320 ms. A pessoa vê a troca acontecer em vez de ver tudo mudar de uma vez.
// Cada visão fica montada (inerte quando fechada); a última versão de uma visão que deixou de existir é guardada para que ela
// tenha conteúdo enquanto encolhe. Ao trocar, a rolagem do painel volta ao topo, também suave.
function ViewSwap({ view, views }: { view: string; views: Record<string, React.ReactNode | null> }) {
  const kept = React.useRef<Record<string, React.ReactNode>>({})
  for (const [key, node] of Object.entries(views)) if (node != null) kept.current[key] = node

  const root = React.useRef<HTMLDivElement>(null)
  const first = React.useRef(true)
  React.useEffect(() => {
    if (first.current) { first.current = false; return }
    const scroller = root.current?.closest("[data-panel-scroll]") as HTMLElement | null
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    scroller?.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" })
  }, [view])

  return (
    <div ref={root}>
      {Object.keys(kept.current).map((key) => (
        <Collapse key={key} clip open={key === view}>
          {kept.current[key]}
        </Collapse>
      ))}
    </div>
  )
}

export { ViewSwap }
