"use client"

import { useEffect } from "react"
import type { MultiPolygon, Polygon } from "geojson"
import { MapPin, TreePine } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { FogoMensalFonte } from "@/lib/situacao/fontes"
import type { Alvo, Recorte } from "./alvo"
import { Cartao } from "./cartao"
import { desmatamento, haCurto } from "./estado"
import { CartaoFogoMensal } from "./resumo"
import type { OnMostrar } from "./SituacaoPanel"
import { useJson } from "./use-json"

// O resumo de uma área clicada no mapa (DESIGN.md 13.10, "Recorte por área"): os mesmos cartões da região, com os números só de
// dentro da área. O cabeçalho diz onde a pessoa está e tem a saída de volta para a região inteira.

interface RecorteDaArea {
  area: { nome: string; camada: string; ha: number; geometria: Polygon | MultiPolygon }
  fogoMensal: FogoMensalFonte[]
  desmatamento: { camada?: { slug: string; nome: string }; porAnoMes: Record<number, number[]> } | null
}

const acao =
  "min-h-10 rounded-sm px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"

export function RecorteResumo({ recorte, regiaoId, onAbrir, onMostrar, onSair, onVerDados }: {
  recorte: Recorte
  regiaoId: number
  onAbrir: (a: Alvo) => void
  onMostrar?: OnMostrar
  onSair?: () => void
  onVerDados?: () => void
}) {
  const c = useJson<RecorteDaArea>(
    `/api/situacao/recorte?regiao_id=${regiaoId}&camada=${encodeURIComponent(recorte.slug)}&area=${recorte.featureId}`,
  )

  // a área inteira desenhada e enquadrada no espaço livre do mapa (o clique só tinha o pedaço visível dela)
  const geometria = c.data?.area.geometria
  useEffect(() => { if (geometria) onMostrar?.(geometria) }, [geometria, onMostrar])

  const r = c.data
  const cabecalho = (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid size-9 flex-none place-items-center rounded-full bg-secondary text-secondary-foreground">
          <MapPin className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          {r ? (
            <>
              <p className="text-sm font-medium leading-snug">Em {r.area.nome}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.area.camada} · {haCurto(r.area.ha)}. Os números abaixo são só de dentro desta área.
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {onSair && <button type="button" onClick={onSair} className={acao}>Ver a região inteira</button>}
        {onVerDados && <button type="button" onClick={onVerDados} className={acao}>Ver os dados da área</button>}
      </div>
    </div>
  )

  if (c.estado === "carregando") {
    return (
      <div className="space-y-4" aria-busy>
        {cabecalho}
        <p className="text-sm text-muted-foreground">Calculando o fogo e o desmatamento dentro da área…</p>
        <div className="rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      </div>
    )
  }

  if (c.estado === "erro" || !r) {
    return (
      <div className="space-y-4">
        {cabecalho}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Não foi possível ler os dados desta área.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">A região inteira continua disponível.</p>
          <button type="button" onClick={c.tentar} className={`mt-3 ${acao}`}>Tentar de novo</button>
        </div>
      </div>
    )
  }

  const nada = r.fogoMensal.length === 0 && !r.desmatamento
  const d = r.desmatamento
  const estadoDesmat = d ? desmatamento(d.porAnoMes) : null

  return (
    <div className="space-y-4">
      {cabecalho}
      {nada && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium">Nada de fogo ou desmatamento acompanhado aqui</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            A região não tem camada de fogo por mês nem alertas de desmatamento que cubram esta área. Os dados da própria área continuam
            em “Ver os dados da área”.
          </p>
        </div>
      )}
      {r.fogoMensal.map((f) => <CartaoFogoMensal key={f.slug} fogo={f} onAbrir={onAbrir} area={r.area.nome} />)}
      {d && estadoDesmat && (
        <Cartao
          titulo={d.camada ? `Desmatamento · ${d.camada.nome}` : "Desmatamento"}
          icone={TreePine}
          estado="pronto"
          tom={estadoDesmat.tom}
          frase={estadoDesmat.frase}
          apoio={estadoDesmat.apoio}
          serie={estadoDesmat.serie}
          onAbrir={() => onAbrir({ tipo: "desmatamento", area: r.area.nome, desmatamentoDados: d.porAnoMes, ...(d.camada && { camada: d.camada }) })}
          onTentar={c.tentar}
        />
      )}
    </div>
  )
}
