"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { controlSurface } from "./helpers/control-style"
import { cn } from "@/lib/utils"

// Cartão da propriedade (ferramenta Consultar › Propriedade): abre acima da faixa de modo com o que o mapa já sabe
// (nome, área, município, CAR) e busca os números do dossiê um instante depois. Cor só em ponto preenchido com rótulo:
// o âmbar não tem contraste para texto (DESIGN.md 4.2).

interface PropertyBasic {
  nome?: string
  cod_imovel?: string
  municipio?: string
  num_area?: number
}

interface DossieData {
  nome: string
  cod_imovel: string
  municipio: string
  num_area: number
  focosCount: number
  desmatamentoCount: number
  acoes: Array<{ carater?: string }>
}

interface PropertyInfoCardProps {
  hoveredPropertyId: number | null
  hoveredPropertyBasic: PropertyBasic | null
}

type Fetch = "idle" | "loading" | "done" | "error"

export function PropertyInfoCard({ hoveredPropertyId, hoveredPropertyBasic }: PropertyInfoCardProps) {
  const [dossie, setDossie] = useState<DossieData | null>(null)
  const [state, setState] = useState<Fetch>("idle")
  const currentIdRef = useRef<number | null>(null)

  useEffect(() => {
    setDossie(null)
    if (!hoveredPropertyId) { setState("idle"); return }
    setState("loading")
    // o mouse passa por várias propriedades: só busca a que ficou parada
    const t = setTimeout(async () => {
      currentIdRef.current = hoveredPropertyId
      try {
        const res = await fetch(`/api/propriedades/${hoveredPropertyId}/dossie`)
        const json = await res.json()
        if (currentIdRef.current !== hoveredPropertyId) return
        if (json.success) { setDossie(json.data); setState("done") } else setState("error")
      } catch {
        if (currentIdRef.current === hoveredPropertyId) setState("error")
      }
    }, 320)
    return () => clearTimeout(t)
  }, [hoveredPropertyId])

  if (!hoveredPropertyBasic) return null

  const nome = dossie?.nome || hoveredPropertyBasic.nome
  const area = dossie?.num_area ?? hoveredPropertyBasic.num_area
  const municipio = dossie?.municipio || hoveredPropertyBasic.municipio
  const car = dossie?.cod_imovel || hoveredPropertyBasic.cod_imovel
  const acoes = dossie?.acoes ?? []
  const passivas = acoes.filter((a) => a.carater?.toLowerCase().includes("passiv")).length
  const ativas = acoes.filter((a) => a.carater?.toLowerCase().includes("ativ") && !a.carater?.toLowerCase().includes("passiv")).length

  return (
    <div className={cn("w-72 max-w-full rounded-lg p-4", controlSurface)}>
      <h4 className="text-base font-semibold leading-tight">{nome || "Propriedade"}</h4>

      <dl className="mt-3 space-y-1.5 text-sm">
        {area != null && <Row label="Área" value={`${Number(area).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`} mono />}
        {municipio && <Row label="Município" value={municipio} />}
        {car && <Row label="CAR" value={car.length > 22 ? `…${car.slice(-20)}` : car} mono small />}
      </dl>

      <div className="mt-3 border-t border-border pt-3" aria-live="polite">
        {state === "loading" && (
          <div role="status">
            <div className="bg-shimmer h-9 rounded-md" aria-hidden />
            <span className="sr-only">Buscando os números da propriedade…</span>
          </div>
        )}
        {state === "error" && <p className="text-sm text-muted-foreground">Não conseguimos buscar os números desta propriedade.</p>}
        {state === "done" && dossie && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat value={dossie.focosCount} label="Focos" dot="bg-crit" />
              <Stat value={dossie.desmatamentoCount} label="Desmate" dot="bg-warn" />
              <Stat value={acoes.length} label="Ações" dot="bg-mineral" />
            </div>
            {acoes.length > 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                <span className="font-mono tabular-nums">{ativas}</span> ativa{ativas === 1 ? "" : "s"} ·{" "}
                <span className="font-mono tabular-nums">{passivas}</span> passiva{passivas === 1 ? "" : "s"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
      <dd className={cn("break-all font-medium", mono && "font-mono tabular-nums", small && "text-xs")}>{value}</dd>
    </div>
  )
}

function Stat({ value, label, dot }: { value: number; label: ReactNode; dot: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold tabular-nums leading-none">{value}</div>
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden />
        {label}
      </div>
    </div>
  )
}
