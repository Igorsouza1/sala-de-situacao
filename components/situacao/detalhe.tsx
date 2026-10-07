"use client"

import { useCallback, useState, type ReactNode } from "react"
import { ArrowLeft, CloudRain, Droplet, Droplets, Eye, Flame, PawPrint, RefreshCw, TreePine, Waves, type LucideIcon } from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useUserRole } from "@/hooks/useUserRole"
import { formatDate } from "@/lib/helpers/formatter/formatDate"
import { formatTime } from "@/lib/helpers/formatter/formatTime"
import { KpiCard } from "@/components/dashboard/kpis/KpiCard"
import type { KpiTrend } from "@/components/dashboard/kpis/KpiCard"
import { GraficoFogo } from "@/components/dashboard/charts/grafico-fogo"
import { GraficoDesmatamento } from "@/components/dashboard/charts/grafico-desmatamento"
import { GraficoTurbidezDeque } from "@/components/dashboard/charts/GraficoTurbidezDeque"
import { GraficoSecchiDeque } from "@/components/dashboard/charts/GraficoSecchiDeque"
import { GraficoPluviometriaDeque } from "@/components/dashboard/charts/GraficoPluviometriaDeque"
import { GraficoNivelRioBalneario } from "@/components/dashboard/charts/GraficoNivelRioBalneario"
import { GraficoPluviometriaBalneario } from "@/components/dashboard/charts/GraficoPluviometriaBalneario"
import { GraficoSecchiBalneario } from "@/components/dashboard/charts/GraficoSecchiBalneario"
import { GraficoSaudeRio } from "@/components/dashboard/charts/GraficoSaudeRio"
import { GraficoProximidadeBalneario } from "@/components/dashboard/charts/GraficoProximidadeBalneario"
import { GraficoPonteCure } from "@/components/dashboard/charts/GraficoCureDiario"
import { useBalnearioMunicipal } from "@/context/BalnearioMunicipalContext"
import { useDequePedras } from "@/context/DequePedrasContext"
import { useDesmatamento } from "@/context/DesmatamentoContext"
import { useFogo } from "@/context/FogoContext"
import { useJson } from "./use-json"
import type { Alvo, TipoAlvo } from "./alvo"

const SEM_SYNC = "Esta estação ainda não recebe leituras novas: o que aparece é o que já estava guardado."

const TITULOS: Record<TipoAlvo, { titulo: string; icone: LucideIcon }> = {
  focos: { titulo: "Focos de calor", icone: Flame },
  desmatamento: { titulo: "Desmatamento", icone: TreePine },
  javali: { titulo: "Avistamentos de javali", icone: PawPrint },
  formoso: { titulo: "Rio Formoso · Balneário Municipal", icone: Waves },
  prata: { titulo: "Rio da Prata · Deque de Pedras", icone: Droplets },
  cure: { titulo: "Ponte do Cure", icone: Waves },
}

// ── comuns ──────────────────────────────────────────────────────────────────────────────────────

function trend(delta: number | null | undefined): KpiTrend {
  if (delta == null || !Number.isFinite(delta)) return "estavel"
  return delta > 1 ? "alta" : delta < -1 ? "baixa" : "estavel"
}

function pct(delta: number | null | undefined, sufixo: string): string | undefined {
  if (delta == null || !Number.isFinite(delta)) return undefined
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% ${sufixo}`
}

// o período vale só para este assunto (o resumo mostra sempre "agora")
function SeletorAno({ ano, onChange }: { ano: string; onChange: (ano: string) => void }) {
  const anos = Array.from({ length: new Date().getFullYear() - 2020 }, (_, i) => String(new Date().getFullYear() - i))
  return (
    <Select value={ano} onValueChange={onChange}>
      <SelectTrigger aria-label="Período" className="h-10 w-44 rounded-sm bg-card text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todo o período</SelectItem>
        {anos.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function Moldura({ tipo, voltar, acao, children }: { tipo: TipoAlvo; voltar: () => void; acao?: ReactNode; children: ReactNode }) {
  const { titulo, icone: Icone } = TITULOS[tipo]
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={voltar}
          className="group -ml-2 flex min-h-10 items-center gap-1.5 rounded-sm px-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-ring/30"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 ease-spring group-hover:-translate-x-0.5" aria-hidden />
          Voltar à situação
        </button>
        {acao}
      </div>
      <h4 className="flex items-center gap-2 text-base font-semibold">
        <Icone className="h-4 w-4 flex-none text-muted-foreground" aria-hidden />
        <span className="truncate">{titulo}</span>
      </h4>
      {children}
    </div>
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">{children}</p>
}

// o registro clicado no mapa, dito em frases (nenhum nome de coluna na tela)
function Registro({ titulo, linhas }: { titulo: string; linhas: [string, ReactNode][] }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h5 className="text-sm font-medium text-muted-foreground">{titulo}</h5>
      <dl className="mt-2 space-y-1">
        {linhas.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="text-right text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const txt = (v: unknown) => (v == null || v === "" ? null : String(v))

// ── um detalhe por assunto ──────────────────────────────────────────────────────────────────────

function DetalheFocos({ item, voltar }: { item?: Record<string, unknown>; voltar: () => void }) {
  const { selectedYear, setSelectedYear } = useFogo()
  return (
    <Moldura tipo="focos" voltar={voltar} acao={<SeletorAno ano={selectedYear} onChange={setSelectedYear} />}>
      {item && (
        <Registro
          titulo="Este foco"
          linhas={[
            ["Detectado em", item.acq_date ? formatDate(String(item.acq_date)) : null],
            ["Hora", item.acq_time ? formatTime(String(item.acq_time)) : null],
            ["Confiança", txt(item.confidence)],
            ["Propriedade (CAR)", txt(item.cod_imovel)],
          ]}
        />
      )}
      <GraficoFogo />
    </Moldura>
  )
}

function DetalheDesmatamento({ item, voltar }: { item?: Record<string, unknown>; voltar: () => void }) {
  const { selectedYear, setSelectedYear } = useDesmatamento()
  const ha = Number(item?.alertha)
  return (
    <Moldura tipo="desmatamento" voltar={voltar} acao={<SeletorAno ano={selectedYear} onChange={setSelectedYear} />}>
      {item && (
        <Registro
          titulo="Este alerta"
          linhas={[
            ["Área", Number.isFinite(ha) ? `${ha.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} hectares` : null],
            ["Detectado em", item.detectat ? formatDate(String(item.detectat)) : null],
            ["Estado", txt(item.state)],
          ]}
        />
      )}
      <GraficoDesmatamento />
    </Moldura>
  )
}

function DetalheJavali({ voltar }: { voltar: () => void }) {
  const c = useJson<{ total: number; thisMonth: number; lastMonth: number; sparkline: number[] }>("/api/javali-avistamentos/indicador")
  const meses = ["mês", "mês", "mês", "mês", "mês passado", "este mês"]
  const dados = (c.data?.sparkline ?? []).map((relatos, i) => ({ mes: meses[i] ?? "", relatos }))
  return (
    <Moldura tipo="javali" voltar={voltar}>
      <section className="rounded-lg border border-border bg-card p-4">
        <h5 className="text-sm font-medium text-muted-foreground">Relatos nos últimos 6 meses</h5>
        {c.estado === "carregando" && <Skeleton className="mt-3 h-40 w-full" />}
        {c.estado === "erro" && (
          <div className="mt-3">
            <p className="text-sm">Não foi possível carregar os relatos.</p>
            <Button variant="ghost" className="mt-2" onClick={c.tentar}>Tentar de novo</Button>
          </div>
        )}
        {c.estado === "pronto" && (
          <>
            <p className="mt-1 text-sm">{c.data?.total ?? 0} relatos no total, {c.data?.thisMonth ?? 0} neste mês.</p>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dados} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} interval={0} hide />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                  <Tooltip formatter={(v) => [`${v} relatos`, ""]} labelFormatter={() => ""} />
                  <Bar dataKey="relatos" fill="var(--color-mineral)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>
    </Moldura>
  )
}

function DetalhePrata({ voltar }: { voltar: () => void }) {
  const { selectedYear, setSelectedYear } = useDequePedras()
  const turbidez = useJson<{ current: number | null; deltaPct: number | null; sparkline: number[]; status: "normal" | "atencao" | "critico"; secchiVertical: number | null; lastDate: string | null }>("/api/deque-pedras/indicadores/turbidez")
  const chuva = useJson<{ mtdAtual: number | null; deltaPct: number | null }>("/api/deque-pedras/indicadores/chuva")
  const t = turbidez.data
  return (
    <Moldura tipo="prata" voltar={voltar} acao={<SeletorAno ano={selectedYear} onChange={setSelectedYear} />}>
      <Aviso>{SEM_SYNC}</Aviso>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KpiCard title="Turbidez" icon={Droplets} value={t?.current ?? null} unit="NTU" trend={trend(t?.deltaPct)} trendSemantic="negativo" trendLabel={pct(t?.deltaPct, "vs semana anterior")} sparklineData={t?.sparkline} colorScheme={t ? (t.status === "critico" ? "danger" : t.status === "atencao" ? "warning" : "success") : "info"} loading={turbidez.estado === "carregando"} />
        <KpiCard title="Pluviometria" icon={CloudRain} value={chuva.data?.mtdAtual ?? null} unit="mm" trend={trend(chuva.data?.deltaPct)} trendSemantic="neutro" trendLabel={pct(chuva.data?.deltaPct, "vs mesmo período ano passado")} colorScheme="info" loading={chuva.estado === "carregando"} />
      </div>
      <GraficoTurbidezDeque />
      <GraficoSecchiDeque />
      <GraficoPluviometriaDeque />
    </Moldura>
  )
}

function DetalheFormoso({ voltar }: { voltar: () => void }) {
  const { selectedYear, setSelectedYear } = useBalnearioMunicipal()
  const { canEdit } = useUserRole()
  const { toast } = useToast()
  const [sincronizando, setSincronizando] = useState(false)
  const nivel = useJson<{ current: number | null; deltaPct: number | null }>("/api/balneario-municipal/indicadores/nivel-agua")
  const chuva = useJson<{ mtdAtual: number | null; deltaPct: number | null }>("/api/balneario-municipal/indicadores/pluviometria")
  const secchi = useJson<{ current: number | null; deltaPct: number | null }>("/api/balneario-municipal/indicadores/secchi")

  const sincronizar = useCallback(async () => {
    setSincronizando(true)
    try {
      const res = await fetch("/api/balneario-municipal/sync", { method: "POST" })
      const json = await res.json()
      if (json?.success) {
        const { inserted, updated } = json.data
        toast({ title: "Planilha sincronizada", description: `${inserted} registro(s) novo(s) e ${updated} atualizado(s).` })
      } else {
        toast({ title: "Não foi possível sincronizar", description: String(json?.error?.message ?? json?.error ?? "Tente de novo em instantes."), variant: "destructive" })
      }
    } catch {
      toast({ title: "Não foi possível sincronizar", description: "Parece que você está sem conexão. Tente de novo quando voltar.", variant: "destructive" })
    } finally {
      setSincronizando(false)
    }
  }, [toast])

  return (
    <Moldura tipo="formoso" voltar={voltar} acao={<SeletorAno ano={selectedYear} onChange={setSelectedYear} />}>
      {canEdit && (
        <Button variant="outline" onClick={sincronizar} disabled={sincronizando} className="min-h-10 w-full gap-2">
          <RefreshCw className={sincronizando ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
          {sincronizando ? "Sincronizando a planilha…" : "Sincronizar planilha"}
        </Button>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="Nível da água" icon={Droplet} value={nivel.data?.current ?? null} unit="cm" trend={trend(nivel.data?.deltaPct)} trendSemantic="neutro" trendLabel={pct(nivel.data?.deltaPct, "vs mesmo período ano passado")} colorScheme="info" loading={nivel.estado === "carregando"} />
        <KpiCard title="Pluviometria" icon={CloudRain} value={chuva.data?.mtdAtual ?? null} unit="mm" trend={trend(chuva.data?.deltaPct)} trendSemantic="neutro" trendLabel={pct(chuva.data?.deltaPct, "vs mesmo período ano passado")} colorScheme="info" loading={chuva.estado === "carregando"} />
        <KpiCard title="Secchi vertical" icon={Eye} value={secchi.data?.current ?? null} unit="m" trend={trend(secchi.data?.deltaPct)} trendSemantic="neutro" trendLabel={pct(secchi.data?.deltaPct, "vs mesmo período ano passado")} colorScheme="info" loading={secchi.estado === "carregando"} />
      </div>
      <GraficoNivelRioBalneario />
      <GraficoPluviometriaBalneario />
      <GraficoSecchiBalneario />
      <GraficoSaudeRio />
      <GraficoProximidadeBalneario />
    </Moldura>
  )
}

function DetalheCure({ voltar }: { voltar: () => void }) {
  return (
    <Moldura tipo="cure" voltar={voltar}>
      <Aviso>{SEM_SYNC}</Aviso>
      <GraficoPonteCure />
    </Moldura>
  )
}

export function Detalhe({ alvo, voltar }: { alvo: Alvo; voltar: () => void }) {
  switch (alvo.tipo) {
    case "focos": return <DetalheFocos item={alvo.item} voltar={voltar} />
    case "desmatamento": return <DetalheDesmatamento item={alvo.item} voltar={voltar} />
    case "javali": return <DetalheJavali voltar={voltar} />
    case "formoso": return <DetalheFormoso voltar={voltar} />
    case "prata": return <DetalhePrata voltar={voltar} />
    case "cure": return <DetalheCure voltar={voltar} />
  }
}
