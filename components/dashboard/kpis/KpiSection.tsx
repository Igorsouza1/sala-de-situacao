"use client"

import { useState, useEffect } from "react"
import { Flame, TreePine, Droplets, CloudRain, Waves, PawPrint, ShieldAlert, Droplet } from "lucide-react"
import { KpiCard, KpiColorScheme, KpiTrend } from "./KpiCard"

interface KpiData<T> {
  data: T | null
  loading: boolean
}

interface FocosData {
  current: number
  previous: number
  deltaPct: number | null
  sparkline: number[]
}

interface DesmatamentoData {
  currentHa: number
  lastHa: number
  deltaPct: number | null
  sparkline: number[]
  year: number
}

interface JavaliData {
  total: number
  thisMonth: number
  lastMonth: number
  deltaPct: number | null
  sparkline: number[]
}

interface TurbidezData {
  current: number | null
  thisWeekAvg: number | null
  lastWeekAvg: number | null
  deltaPct: number | null
  sparkline: number[]
  status: "normal" | "atencao" | "critico"
  lastDate: string | null
  secchiVertical: number | null
}

interface ChuvaData {
  mtdAtual: number | null
  mtdPassado: number | null
  deltaPct: number | null
}

interface NivelRioData {
  mtdAtual: number | null
  mtdPassado: number | null
  deltaPct: number | null
}

interface NivelAguaBalnearioData {
  current: number | null
  mtdAtual: number | null
  mtdPassado: number | null
  deltaPct: number | null
  lastDate: string | null
}

function useFetch<T>(url: string): KpiData<T> {
  const [state, setState] = useState<KpiData<T>>({ data: null, loading: true })

  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((json) => setState({ data: json?.success ? json.data : null, loading: false }))
      .catch(() => setState({ data: null, loading: false }))
  }, [url])

  return state
}

function trendFromDelta(delta: number | null | undefined): KpiTrend {
  if (delta == null || !Number.isFinite(delta)) return "estavel"
  if (delta > 1) return "alta"
  if (delta < -1) return "baixa"
  return "estavel"
}

function fmtPct(delta: number | null | undefined, suffix: string): string | undefined {
  if (delta == null || !Number.isFinite(delta)) return undefined
  const sign = delta >= 0 ? "+" : ""
  return `${sign}${delta.toFixed(1)}% ${suffix}`
}

function turbidezScheme(status: "normal" | "atencao" | "critico"): KpiColorScheme {
  if (status === "critico") return "danger"
  if (status === "atencao") return "warning"
  return "success"
}

function GroupHeader({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}

export function KpiSection() {
  const focos       = useFetch<FocosData>("/api/fogo/indicador")
  const desmatamento = useFetch<DesmatamentoData>("/api/desmatamento/indicador")
  const javali      = useFetch<JavaliData>("/api/javali-avistamentos/indicador")
  const turbidez    = useFetch<TurbidezData>("/api/deque-pedras/indicadores/turbidez")
  const chuva       = useFetch<ChuvaData>("/api/deque-pedras/indicadores/chuva")
  const nivelRio    = useFetch<NivelRioData>("/api/ponte-cure/indicador/nivel-rio")
  const nivelAgua   = useFetch<NivelAguaBalnearioData>("/api/balneario-municipal/indicadores/nivel-agua")

  const focosTrend       = trendFromDelta(focos.data?.deltaPct)
  const desmatamentoTrend = trendFromDelta(desmatamento.data?.deltaPct)
  const javaliTrend      = trendFromDelta(javali.data?.deltaPct)
  const turbidezTrend    = trendFromDelta(turbidez.data?.deltaPct)
  const chuvaTrend       = trendFromDelta(chuva.data?.deltaPct)
  const rioTrend         = trendFromDelta(nivelRio.data?.deltaPct)
  const nivelAguaTrend   = trendFromDelta(nivelAgua.data?.deltaPct)

  // Javali: show "(0)" explicitly when count is zero, "--" when no data
  const javaliValue =
    javali.data === null
      ? null
      : javali.data.total === 0
      ? "(0)"
      : javali.data.total

  const javaliUnit = javali.data?.total === 0 ? "" : "relatos"

  return (
    <section className="space-y-6">

      {/* ── Ameaças em Tempo Real ── */}
      <div>
        <GroupHeader icon={ShieldAlert} label="Ameaças em Tempo Real" color="text-red-400" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <KpiCard
            title="Focos de Incêndio"
            icon={Flame}
            value={focos.data?.current ?? null}
            unit="focos"
            trend={focosTrend}
            trendSemantic="negativo"
            trendLabel={fmtPct(focos.data?.deltaPct, "vs 30 dias atrás")}
            sparklineData={focos.data?.sparkline}
            colorScheme={focosTrend === "alta" ? "danger" : focosTrend === "baixa" ? "success" : "info"}
            tooltip="Focos de calor detectados via satélite VIIRS nos últimos 30 dias na área de monitoramento."
            loading={focos.loading}
          />

          <KpiCard
            title="Alertas de Desmatamento"
            icon={TreePine}
            value={desmatamento.data?.currentHa ?? null}
            unit="ha"
            trend={desmatamentoTrend}
            trendSemantic="negativo"
            trendLabel={fmtPct(desmatamento.data?.deltaPct, `vs ${(desmatamento.data?.year ?? new Date().getFullYear()) - 1}`)}
            sparklineData={desmatamento.data?.sparkline}
            colorScheme={desmatamentoTrend === "alta" ? "danger" : desmatamentoTrend === "baixa" ? "success" : "info"}
            tooltip={`Hectares com alertas de desmatamento em ${desmatamento.data?.year ?? new Date().getFullYear()}, comparado ao ano anterior.`}
            loading={desmatamento.loading}
          />

          <KpiCard
            title="Avistamentos de Javali"
            icon={PawPrint}
            value={javaliValue}
            unit={javaliUnit}
            trend={javaliTrend}
            trendSemantic="negativo"
            trendLabel={fmtPct(javali.data?.deltaPct, "vs mês anterior")}
            sparklineData={javali.data?.sparkline}
            colorScheme={javaliTrend === "alta" ? "warning" : "info"}
            tooltip="Total de avistamentos de javali (Sus scrofa) registrados pelo formulário público e equipes de campo. Espécie que degrada nascentes e APPs."
            loading={javali.loading}
          />

        </div>
      </div>

      {/* ── Guardião das Águas ── */}
      <div>
        <GroupHeader icon={Droplets} label="Guardião das Águas" color="text-blue-400" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <KpiCard
            title="Turbidez — Deque de Pedras"
            icon={Droplets}
            value={turbidez.data?.current ?? null}
            unit="NTU"
            trend={turbidezTrend}
            trendSemantic="negativo"
            trendLabel={fmtPct(turbidez.data?.deltaPct, "vs semana anterior")}
            sparklineData={turbidez.data?.sparkline}
            colorScheme={turbidez.data ? turbidezScheme(turbidez.data.status) : "info"}
            tooltip="Última leitura de turbidez no Deque de Pedras. Verde < 40 NTU, Amarelo 40–100, Vermelho > 100. Base para interdição de atrativos turísticos."
            loading={turbidez.loading}
          />

          <KpiCard
            title="Pluviometria — Deque de Pedras"
            icon={CloudRain}
            value={chuva.data?.mtdAtual ?? null}
            unit="mm"
            trend={chuvaTrend}
            trendSemantic="neutro"
            trendLabel={fmtPct(chuva.data?.deltaPct, "vs mesmo período ano passado")}
            colorScheme="info"
            tooltip="Chuva acumulada no mês (Deque de Pedras). Cruzar com turbidez para distinguir turbidez natural de carreamento por desmatamento."
            loading={chuva.loading}
          />

          <KpiCard
            title="Nível do Rio — Ponte do Cure"
            icon={Waves}
            value={nivelRio.data?.mtdAtual ?? null}
            unit="m"
            trend={rioTrend}
            trendSemantic="neutro"
            trendLabel={fmtPct(nivelRio.data?.deltaPct, "vs mesmo período ano passado")}
            colorScheme="info"
            tooltip="Média da lâmina d'água na Ponte do Cure no mês atual, comparada ao mesmo período do ano anterior."
            loading={nivelRio.loading}
          />

          <KpiCard
            title="Nível da Água — Balneário"
            icon={Droplet}
            value={nivelAgua.data?.current ?? null}
            unit="cm"
            trend={nivelAguaTrend}
            trendSemantic="neutro"
            trendLabel={fmtPct(nivelAgua.data?.deltaPct, "vs mesmo período ano passado")}
            colorScheme="info"
            tooltip="Último nível da água medido no Balneário Municipal, comparado à média do mesmo período do ano anterior."
            loading={nivelAgua.loading}
          />

        </div>
      </div>

    </section>
  )
}
