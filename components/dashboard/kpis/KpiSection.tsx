"use client"

import { useState, useEffect } from "react"
import {
  Flame,
  TreePine,
  Droplets,
  CloudRain,
  Waves,
  PawPrint,
  ShieldAlert,
  Droplet,
  Eye,
  MapPin,
} from "lucide-react"
import { KpiCard, KpiColorScheme, KpiTrend } from "./KpiCard"

// ─── Interfaces ─────────────────────────────────────────────────────────────

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

interface NivelAguaBalnearioData {
  current: number | null
  mtdAtual: number | null
  mtdPassado: number | null
  deltaPct: number | null
  lastDate: string | null
}

interface SecchiData {
  current: number | null
  mtdAtual: number | null
  mtdPassado: number | null
  deltaPct: number | null
  lastDate: string | null
}

// ─── Hook ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ElementType
  label: string
  description: string
  location?: string
  accentClass: string
  iconColorClass: string
}

function SectionHeader({
  icon: Icon,
  label,
  description,
  location,
  accentClass,
  iconColorClass,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-none mt-0.5 ${accentClass}`}>
          <Icon className={`h-4.5 w-4.5 ${iconColorClass}`} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground leading-snug">{label}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {location && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 bg-muted/50 px-2.5 py-1 rounded-full border border-border/60 flex-none mt-0.5 ml-4">
          <MapPin className="h-3 w-3" />
          {location}
        </span>
      )}
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function GroupDivider() {
  return <div className="border-t border-border/50 my-8" />
}

// ─── KpiSection ──────────────────────────────────────────────────────────────

export function KpiSection() {
  // Grupo 1 — Ameaças Ambientais
  const focos        = useFetch<FocosData>("/api/fogo/indicador")
  const desmatamento = useFetch<DesmatamentoData>("/api/desmatamento/indicador")
  const javali       = useFetch<JavaliData>("/api/javali-avistamentos/indicador")

  // Grupo 2 — Balneário Municipal
  const nivelAgua      = useFetch<NivelAguaBalnearioData>("/api/balneario-municipal/indicadores/nivel-agua")
  const chuvaBalneario = useFetch<ChuvaData>("/api/balneario-municipal/indicadores/pluviometria")
  const secchiBalneario = useFetch<SecchiData>("/api/balneario-municipal/indicadores/secchi")

  // Grupo 3 — Deque de Pedras
  const turbidez    = useFetch<TurbidezData>("/api/deque-pedras/indicadores/turbidez")
  const chuvaDeque  = useFetch<ChuvaData>("/api/deque-pedras/indicadores/chuva")

  // Trends
  const focosTrend       = trendFromDelta(focos.data?.deltaPct)
  const desmatamentoTrend = trendFromDelta(desmatamento.data?.deltaPct)
  const javaliTrend      = trendFromDelta(javali.data?.deltaPct)
  const nivelAguaTrend   = trendFromDelta(nivelAgua.data?.deltaPct)
  const chuvaBalnearioTrend = trendFromDelta(chuvaBalneario.data?.deltaPct)
  const secchiBalnearioTrend = trendFromDelta(secchiBalneario.data?.deltaPct)
  const turbidezTrend    = trendFromDelta(turbidez.data?.deltaPct)
  const chuvaDequetrend  = trendFromDelta(chuvaDeque.data?.deltaPct)

  const javaliValue =
    javali.data === null
      ? null
      : javali.data.total === 0
      ? "(0)"
      : javali.data.total

  const javaliUnit = javali.data?.total === 0 ? "" : "relatos"

  return (
    <div className="space-y-0">

      {/* ══════════════════════════════════════════════════════════════
          Grupo 1 — Ameaças Ambientais
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          icon={ShieldAlert}
          label="Ameaças Ambientais"
          description="Focos de calor, desmatamento e espécies invasoras nos últimos 30 dias"
          accentClass="bg-red-500/10 border border-red-500/20"
          iconColorClass="text-red-500"
        />
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
            trendLabel={fmtPct(
              desmatamento.data?.deltaPct,
              `vs ${(desmatamento.data?.year ?? new Date().getFullYear()) - 1}`,
            )}
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
            tooltip="Total de avistamentos de javali (Sus scrofa) registrados pelo formulário público e equipes de campo."
            loading={javali.loading}
          />
        </div>
      </section>

      <GroupDivider />

      {/* ══════════════════════════════════════════════════════════════
          Grupo 2 — Balneário Municipal
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          icon={Waves}
          label="Balneário Municipal"
          description="Qualidade da água e condições ambientais no ponto de banho"
          location="Formoso"
          accentClass="bg-blue-500/10 border border-blue-500/20"
          iconColorClass="text-blue-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Nível da Água"
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

          <KpiCard
            title="Pluviometria"
            icon={CloudRain}
            value={chuvaBalneario.data?.mtdAtual ?? null}
            unit="mm"
            trend={chuvaBalnearioTrend}
            trendSemantic="neutro"
            trendLabel={fmtPct(chuvaBalneario.data?.deltaPct, "vs mesmo período ano passado")}
            colorScheme="info"
            tooltip="Chuva acumulada no mês no Balneário Municipal, comparada ao mesmo período do ano anterior."
            loading={chuvaBalneario.loading}
          />

          <KpiCard
            title="Secchi Vertical"
            icon={Eye}
            value={secchiBalneario.data?.current ?? null}
            unit="m"
            trend={secchiBalnearioTrend}
            trendSemantic="neutro"
            trendLabel={fmtPct(secchiBalneario.data?.deltaPct, "vs mesmo período ano passado")}
            colorScheme="info"
            tooltip="Transparência da água medida com disco de Secchi. Valores maiores indicam água mais limpa e transparente."
            loading={secchiBalneario.loading}
          />
        </div>
      </section>

      <GroupDivider />

      {/* ══════════════════════════════════════════════════════════════
          Grupo 3 — Deque de Pedras — Rio da Prata
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          icon={Droplets}
          label="Deque de Pedras"
          description="Turbidez, precipitação e transparência no ponto de imersão"
          location="Rio da Prata"
          accentClass="bg-teal-500/10 border border-teal-500/20"
          iconColorClass="text-teal-500"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Turbidez"
            icon={Droplets}
            value={turbidez.data?.current ?? null}
            unit="NTU"
            trend={turbidezTrend}
            trendSemantic="negativo"
            trendLabel={fmtPct(turbidez.data?.deltaPct, "vs semana anterior")}
            sparklineData={turbidez.data?.sparkline}
            colorScheme={turbidez.data ? turbidezScheme(turbidez.data.status) : "info"}
            tooltip="Última leitura de turbidez no Deque de Pedras. Verde < 40 NTU, Amarelo 40–100, Vermelho > 100."
            loading={turbidez.loading}
          />

          <KpiCard
            title="Pluviometria"
            icon={CloudRain}
            value={chuvaDeque.data?.mtdAtual ?? null}
            unit="mm"
            trend={chuvaDequetrend}
            trendSemantic="neutro"
            trendLabel={fmtPct(chuvaDeque.data?.deltaPct, "vs mesmo período ano passado")}
            colorScheme="info"
            tooltip="Chuva acumulada no mês no Deque de Pedras. Cruzar com turbidez para identificar carreamento por desmatamento."
            loading={chuvaDeque.loading}
          />

          <KpiCard
            title="Secchi Vertical"
            icon={Eye}
            value={turbidez.data?.secchiVertical ?? null}
            unit="m"
            trend="estavel"
            trendSemantic="neutro"
            trendLabel={turbidez.data?.lastDate ? `Coleta em ${turbidez.data.lastDate}` : undefined}
            colorScheme="info"
            tooltip="Transparência da água no Deque de Pedras medida com disco de Secchi na última coleta."
            loading={turbidez.loading}
          />
        </div>
      </section>

    </div>
  )
}
