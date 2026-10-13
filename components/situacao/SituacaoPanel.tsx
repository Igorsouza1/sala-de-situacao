"use client"

import { useEffect, useState } from "react"
import type { Geometry } from "geojson"
import { ViewSwap } from "@/components/ui/view-swap"
import { DailyPonteCureProvider } from "@/context/DailyPonteCureContext"
import { DesmatamentoProvider } from "@/context/DesmatamentoContext"
import { FogoProvider } from "@/context/FogoContext"
import type { Alvo } from "./alvo"
import { Detalhe } from "./detalhe"
import { Resumo } from "./resumo"

/** leva o mapa a uma área e a desenha; `mover = false` só desenha (a câmera já está lá) */
export type OnMostrar = (geometria: Geometry, mover?: boolean) => void

// Cada detalhe monta apenas o contexto de que precisa, depois que a pessoa o abre.
function DetalheComDados({ alvo, voltar, regiaoId, onMostrar }: { alvo: Alvo; voltar: () => void; regiaoId?: number; onMostrar?: OnMostrar }) {
  const detalhe = <Detalhe alvo={alvo} voltar={voltar} regiaoId={regiaoId} onMostrar={onMostrar} />
  switch (alvo.tipo) {
    case "focos": return <FogoProvider>{detalhe}</FogoProvider>
    case "desmatamento": return alvo.item ? detalhe : <DesmatamentoProvider>{detalhe}</DesmatamentoProvider>
    case "cure": return <DailyPonteCureProvider>{detalhe}</DailyPonteCureProvider>
    default: return detalhe
  }
}

// Painel Situação (DESIGN.md 19.2, exceção registrada em 13.10): duas visões trocadas por `ViewSwap`, o resumo e o detalhe.
// O conteúdo só monta na primeira vez que o painel abre: antes disso o mapa não paga as leituras de dados.
export function SituacaoPanel({ open, alvo, onAlvo, regiaoId, onMostrar }: { open: boolean; alvo: Alvo | null; onAlvo: (alvo: Alvo | null) => void; regiaoId?: number; onMostrar?: OnMostrar }) {
  const [jaAbriu, setJaAbriu] = useState(false)
  useEffect(() => { if (open) setJaAbriu(true) }, [open])
  if (!jaAbriu) return null

  return (
    <ViewSwap
      view={alvo ? "detalhe" : "resumo"}
      views={{
        resumo: <Resumo onAbrir={onAlvo} />,
        detalhe: alvo ? <DetalheComDados alvo={alvo} voltar={() => onAlvo(null)} regiaoId={regiaoId} onMostrar={onMostrar} /> : null,
      }}
    />
  )
}
