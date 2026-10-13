"use client"

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react"
import type { Geometry } from "geojson"
import { ChevronDown, MapPin } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { AntesDepois } from "./antes-depois"
import { quando, TOM_COR, type Tom } from "./estado"
import type { OnMostrar } from "./SituacaoPanel"
import { useJson } from "./use-json"

interface Ocorrencia {
  id: number
  data: string | null
  areaTotal: number | null
  areaNaPropriedade: number
  geometria: unknown
}

interface Propriedade {
  id: number
  nome: string | null
  codImovel: string | null
  areaPropriedade: number | null
  geometria: unknown
  atual: Ocorrencia | null
  outras: Ocorrencia[]
  anteriores: number
  dataComparavel: boolean
  ocorrenciasSemData: number
  maiorAnterior: { data: string | null; area: number; diferenca: number } | null
}

interface Relatorio {
  alerta: { id: number; data: string | null; areaTotal: number | null }
  propriedades: Propriedade[]
}

const VISIVEIS = 5

const num = (valor: number) => valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
const ha = (valor: number) => `${num(valor)} ha`
const hectares = (valor: number) => `${num(valor)} ${valor === 1 ? "hectare" : "hectares"}`

function dia(valor: string | null) {
  return valor?.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)?.slice(1, 4).join("-") ?? null
}

// o banco entrega a geometria como objeto ou como texto
function geometria(valor: unknown): Geometry | null {
  if (typeof valor === "string") {
    try { return JSON.parse(valor) as Geometry } catch { return null }
  }
  return valor && typeof valor === "object" && "type" in valor ? valor as Geometry : null
}

// Cada cartão entra em ordem de leitura, 60 ms depois do anterior (DESIGN.md 19.2)
const entrada = (i: number): { className: string; style: CSSProperties } => ({
  className: "animate-in fade-in-0 slide-in-from-bottom-2 duration-300 fill-mode-backwards motion-reduce:animate-none",
  style: { animationDelay: `${i * 60}ms` },
})

function Cartao({ titulo, ordem, aside, children }: { titulo: string; ordem: number; aside?: ReactNode; children: ReactNode }) {
  const { className, style } = entrada(ordem)
  return (
    <section className={cn("rounded-lg border border-border bg-card p-4", className)} style={style}>
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-sm font-medium text-muted-foreground">{titulo}</h5>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Selo({ tom, palavra }: { tom: Tom; palavra: string }) {
  return (
    <span className="flex flex-none items-center gap-1.5 text-xs text-muted-foreground">
      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: TOM_COR[tom] }} />
      {palavra}
    </span>
  )
}

// O que importa primeiro: o tamanho do alerta, uma vez, grande; depois quando foi e o que ele significa para este imóvel.
function Destaque({ alerta, propriedade }: { alerta: Relatorio["alerta"]; propriedade: Propriedade | null }) {
  const area = alerta.areaTotal ?? propriedade?.atual?.areaNaPropriedade ?? null
  const dentro = propriedade?.atual?.areaNaPropriedade ?? null
  const parcial = area != null && dentro != null && area - dentro >= 0.01
  const detectado = quando(alerta.data)

  let selo: { tom: Tom; palavra: string } | null = null
  let leitura: string | null = null
  if (propriedade) {
    if (!propriedade.dataComparavel) {
      selo = { tom: "neutro", palavra: "Sem data para comparar" }
      leitura = "Sem a data deste alerta não dá para saber quais vieram antes."
    } else if (propriedade.anteriores > 0) {
      selo = { tom: "crit", palavra: propriedade.anteriores === 1 ? "Já teve 1 alerta antes" : `Já teve ${propriedade.anteriores} alertas antes` }
    } else {
      selo = { tom: "atencao", palavra: "Primeiro alerta aqui" }
    }
    const maior = propriedade.maiorAnterior
    if (maior) {
      leitura = Math.abs(maior.diferenca) < 0.005
        ? "Tem a mesma área do maior alerta anterior."
        : maior.diferenca > 0
          ? `É o maior alerta deste imóvel. O maior anterior tinha ${ha(maior.area)}.`
          : `Já houve um alerta maior neste imóvel: ${ha(maior.area)}, ${quando(maior.data) ?? "sem data"}.`
    }
  }

  return (
    <Cartao titulo="Este alerta" ordem={0} aside={selo && <Selo {...selo} />}>
      <p className="mt-2 text-3xl font-semibold leading-none tracking-tight">{area != null ? hectares(area) : "Área não calculada"}</p>
      <p className="mt-2 text-sm">{detectado ? `Detectado ${detectado}` : "Data não informada"}</p>
      {propriedade && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-sm font-medium">{propriedade.nome || "Propriedade sem nome"}</p>
          <p className="mt-0.5 break-all text-xs text-muted-foreground">
            {[propriedade.codImovel && `CAR ${propriedade.codImovel}`, propriedade.areaPropriedade != null && `imóvel de ${hectares(propriedade.areaPropriedade)}`].filter(Boolean).join(" · ")}
          </p>
          {parcial && <p className="mt-2 text-sm">{ha(dentro)} ficam dentro deste imóvel.</p>}
          {leitura && <p className="mt-2 text-sm text-muted-foreground">{leitura}</p>}
        </div>
      )}
    </Cartao>
  )
}

// O que o imóvel já viveu: o total primeiro, depois cada alerta com uma barra que se lê sem ler o número. Tocar numa linha leva o mapa até ela.
function Historico({ propriedade, alertaId, foco, onFoco }: {
  propriedade: Propriedade
  alertaId: number
  foco: number | null
  onFoco: (ocorrencia: Ocorrencia) => void
}) {
  const [todas, setTodas] = useState(false)
  const [montou, setMontou] = useState(false)
  useEffect(() => { const f = requestAnimationFrame(() => setMontou(true)); return () => cancelAnimationFrame(f) }, [])

  const linhas = useMemo(() => {
    const todos = [propriedade.atual, ...propriedade.outras].filter((o): o is Ocorrencia => o != null)
    // mais recentes primeiro; sem data vai para o fim
    return todos.sort((a, b) => (dia(b.data) ?? "").localeCompare(dia(a.data) ?? ""))
  }, [propriedade])
  const total = linhas.reduce((soma, o) => soma + o.areaNaPropriedade, 0)
  const maior = Math.max(...linhas.map((o) => o.areaNaPropriedade), 0.0001)
  const mostradas = todas ? linhas : linhas.slice(0, VISIVEIS)
  const escondidas = linhas.length - mostradas.length

  return (
    <Cartao titulo="Histórico deste imóvel" ordem={2}>
      <p className="mt-2 text-base font-semibold">
        {linhas.length} {linhas.length === 1 ? "alerta" : "alertas"}, {hectares(total)} no total
      </p>
      <ul className="mt-3 -mx-2">
        {mostradas.map((o) => {
          const atual = o.id === alertaId
          const ativa = o.id === foco
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onFoco(o)}
                aria-pressed={ativa}
                aria-label={`Ver no mapa o alerta ${atual ? "aberto" : quando(o.data) ?? "sem data"}, ${ha(o.areaNaPropriedade)}`}
                className={cn(
                  "group flex min-h-12 w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors duration-200",
                  "hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30",
                  ativa && "bg-secondary hover:bg-secondary",
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{atual ? "Este alerta" : quando(o.data) ?? "Data não informada"}</span>
                    <span className="flex-none text-sm tabular-nums">{ha(o.areaNaPropriedade)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                      style={{ width: montou ? `${Math.max(4, (o.areaNaPropriedade / maior) * 100)}%` : "0%", background: atual ? TOM_COR.crit : TOM_COR.atencao }}
                    />
                  </div>
                </div>
                <MapPin aria-hidden className={cn("h-4 w-4 flex-none text-muted-foreground transition-[opacity,translate] duration-200 ease-spring group-hover:translate-x-0.5", ativa ? "text-primary" : "opacity-60 group-hover:opacity-100")} />
              </button>
            </li>
          )
        })}
      </ul>
      {escondidas > 0 && (
        <button
          type="button"
          onClick={() => setTodas(true)}
          className="mt-1 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-sm text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          Mostrar os outros {escondidas}
          <ChevronDown aria-hidden className="h-4 w-4" />
        </button>
      )}
      {propriedade.ocorrenciasSemData > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {propriedade.ocorrenciasSemData === 1 ? "1 alerta não tem data" : `${propriedade.ocorrenciasSemData} alertas não têm data`}, então não entram na comparação.
        </p>
      )}
    </Cartao>
  )
}

function RelatorioPropriedade({ relatorio, propriedade, onMostrar }: { relatorio: Relatorio; propriedade: Propriedade; onMostrar?: OnMostrar }) {
  const alertaId = relatorio.alerta.id
  const [foco, setFoco] = useState<number | null>(alertaId)

  // o desenho exato do alerta no mapa (o clique já levou a câmera até lá com o recorte da tela)
  const exata = useMemo(() => geometria(propriedade.atual?.geometria), [propriedade.atual?.geometria])
  useEffect(() => { if (exata) onMostrar?.(exata, false) }, [exata, onMostrar])

  const escolher = (o: Ocorrencia) => {
    setFoco(o.id)
    const g = geometria(o.geometria)
    if (g) onMostrar?.(g, true)
  }

  return (
    <>
      <Destaque alerta={relatorio.alerta} propriedade={propriedade} />
      <AntesDepois geometria={exata} data={dia(relatorio.alerta.data)} />
      {propriedade.outras.length > 0 && <Historico propriedade={propriedade} alertaId={alertaId} foco={foco} onFoco={escolher} />}
    </>
  )
}

// Quando o alerta cruza mais de um imóvel, a pessoa escolhe qual ver. Lista de linhas, não caixa do navegador (6.2 regra 6).
function EscolhaDeImovel({ propriedades, escolhida, onEscolher }: { propriedades: Propriedade[]; escolhida: number; onEscolher: (id: number) => void }) {
  return (
    <Cartao titulo={`Este alerta cruza ${propriedades.length} imóveis`} ordem={0}>
      <div role="radiogroup" aria-label="Imóvel a analisar" className="mt-2 -mx-2">
        {propriedades.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === escolhida}
            onClick={() => onEscolher(p.id)}
            className={cn(
              "flex min-h-12 w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-sm transition-colors duration-200",
              "hover:bg-muted focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30",
              p.id === escolhida && "bg-secondary hover:bg-secondary",
            )}
          >
            <span aria-hidden className={cn("h-3 w-3 flex-none rounded-full border transition-[background-color,border-color] duration-200", p.id === escolhida ? "border-primary bg-primary" : "border-border bg-card")} />
            <span className="min-w-0 flex-1 truncate font-medium">{p.nome || p.codImovel || `Imóvel ${p.id}`}</span>
          </button>
        ))}
      </div>
    </Cartao>
  )
}

export function RelatorioDesmatamento({ alertaId, regiaoId, onMostrar }: { alertaId: number; regiaoId?: number; onMostrar?: OnMostrar }) {
  const url = `/api/desmatamento/alertas/${alertaId}/relatorio${regiaoId ? `?regiao_id=${regiaoId}` : ""}`
  const carga = useJson<Relatorio>(url)
  const [escolhida, setEscolhida] = useState<number | null>(null)

  if (carga.estado === "carregando") {
    return (
      <div className="space-y-4" aria-busy aria-label="Carregando o alerta">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    )
  }
  if (carga.estado === "erro") {
    return (
      <section className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm">Não foi possível carregar este alerta.</p>
        <p className="mt-0.5 text-xs text-muted-foreground">O resto do painel continua funcionando.</p>
        <button type="button" onClick={carga.tentar} className="mt-3 min-h-10 rounded-sm px-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-secondary focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30">Tentar de novo</button>
      </section>
    )
  }
  const relatorio = carga.data
  if (!relatorio) return null

  if (relatorio.propriedades.length === 0) {
    return (
      <div className="space-y-4">
        <Destaque alerta={relatorio.alerta} propriedade={null} />
        <p className="text-sm text-muted-foreground">Este alerta não cruza nenhum imóvel cadastrado na região, então não há histórico para comparar.</p>
      </div>
    )
  }

  const propriedade = relatorio.propriedades.find((p) => p.id === escolhida) ?? relatorio.propriedades[0]
  return (
    <div className="space-y-4">
      {relatorio.propriedades.length > 1 && <EscolhaDeImovel propriedades={relatorio.propriedades} escolhida={propriedade.id} onEscolher={setEscolhida} />}
      <RelatorioPropriedade key={propriedade.id} relatorio={relatorio} propriedade={propriedade} onMostrar={onMostrar} />
    </div>
  )
}
