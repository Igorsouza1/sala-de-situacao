"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ViewSwap } from "@/components/ui/view-swap"
import { BalnearioMunicipalProvider } from "@/context/BalnearioMunicipalContext"
import { DailyBalnearioProvider } from "@/context/DailyBalnearioContext"
import { DailyDequeProvider } from "@/context/DailyDequeContext"
import { DailyPonteCureProvider } from "@/context/DailyPonteCureContext"
import { DequePedrasProvider } from "@/context/DequePedrasContext"
import { DesmatamentoProvider } from "@/context/DesmatamentoContext"
import { FogoProvider } from "@/context/FogoContext"
import { PonteCureProvider } from "@/context/PonteCureContext"
import type { Alvo } from "./alvo"
import { Detalhe } from "./detalhe"
import { Resumo } from "./resumo"

// Os gráficos de cada assunto leem dos contextos de dados (o mesmo conjunto do dashboard antigo). Ficam só aqui, dentro do painel.
function Dados({ children }: { children: ReactNode }) {
  return (
    <FogoProvider>
      <DesmatamentoProvider>
        <DequePedrasProvider>
          <PonteCureProvider>
            <BalnearioMunicipalProvider>
              <DailyDequeProvider>
                <DailyBalnearioProvider>
                  <DailyPonteCureProvider>{children}</DailyPonteCureProvider>
                </DailyBalnearioProvider>
              </DailyDequeProvider>
            </BalnearioMunicipalProvider>
          </PonteCureProvider>
        </DequePedrasProvider>
      </DesmatamentoProvider>
    </FogoProvider>
  )
}

// Painel Situação (DESIGN.md 19.2, exceção registrada em 13.10): duas visões trocadas por `ViewSwap`, o resumo e o detalhe.
// O conteúdo só monta na primeira vez que o painel abre: antes disso o mapa não paga as leituras de dados.
export function SituacaoPanel({ open, alvo, onAlvo }: { open: boolean; alvo: Alvo | null; onAlvo: (alvo: Alvo | null) => void }) {
  const [jaAbriu, setJaAbriu] = useState(false)
  useEffect(() => { if (open) setJaAbriu(true) }, [open])
  if (!jaAbriu) return null

  return (
    <Dados>
      <ViewSwap
        view={alvo ? "detalhe" : "resumo"}
        views={{
          resumo: <Resumo onAbrir={onAlvo} />,
          detalhe: alvo ? <Detalhe alvo={alvo} voltar={() => onAlvo(null)} /> : null,
        }}
      />
    </Dados>
  )
}
