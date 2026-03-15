"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ComposedChart, Bar, Area,
  CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
  ScatterChart, Scatter,
  ResponsiveContainer,
} from "recharts"
import { format, parseISO, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Activity, Droplets, Eye, TrendingDown } from "lucide-react"

// ─── Estatística ──────────────────────────────────────────────────────────────

function pearsonR(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0))
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0))
  return dx * dy === 0 ? 0 : num / (dx * dy)
}

function linearRegression(pairs: [number, number][]): { slope: number; intercept: number } | null {
  const n = pairs.length
  if (n < 2) return null
  const sx  = pairs.reduce((s, [x])    => s + x,     0)
  const sy  = pairs.reduce((s, [, y])  => s + y,     0)
  const sxy = pairs.reduce((s, [x, y]) => s + x * y, 0)
  const sxx = pairs.reduce((s, [x])    => s + x * x, 0)
  const denom = n * sxx - sx * sx
  if (denom === 0) return null
  const slope     = (n * sxy - sx * sy) / denom
  const intercept = (sy - slope * sx) / n
  return { slope, intercept }
}

// ─── Score de saúde ───────────────────────────────────────────────────────────

function healthScore(avg: number | null): number {
  if (avg === null || avg <= 0) return 0
  if (avg >= 4)   return 100
  if (avg >= 3)   return 75 + ((avg - 3)   / 1)   * 25
  if (avg >= 1.5) return 50 + ((avg - 1.5) / 1.5) * 25
  if (avg >= 0.5) return 25 + ((avg - 0.5) / 1)   * 25
  return (avg / 0.5) * 25
}

function healthLabel(score: number): { text: string; color: string; bg: string } {
  if (score >= 75) return { text: "Excelente", color: "#06b6d4", bg: "bg-cyan-500/10"    }
  if (score >= 50) return { text: "Boa",       color: "#22c55e", bg: "bg-emerald-500/10" }
  if (score >= 25) return { text: "Moderada",  color: "#f97316", bg: "bg-orange-500/10"  }
  return                   { text: "Crítica",  color: "#ef4444", bg: "bg-red-500/10"     }
}

function correlationLabel(r: number): { text: string; color: string } {
  const a = Math.abs(r)
  if (a >= 0.7) return { text: "Forte",    color: r < 0 ? "#06b6d4" : "#f97316" }
  if (a >= 0.4) return { text: "Moderada", color: "#eab308" }
  return               { text: "Fraca",    color: "hsl(var(--muted-foreground))" }
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ─── Tick mensal (vista temporal) ─────────────────────────────────────────────

function XTickMensal({ x, y, payload }: any) {
  const val = payload?.value as string
  if (!val) return null
  const [yr, mo] = val.split("-").map(Number)
  if (mo === 1) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize={11} fontWeight={700}>{yr}</text>
      </g>
    )
  }
  if (mo % 3 !== 0) return null
  const abbr = format(new Date(yr, mo - 1, 1), "MMM", { locale: ptBR }).replace(".", "").slice(0, 3)
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle"
        fill="hsl(var(--muted-foreground))" fontSize={10}>{abbr}</text>
    </g>
  )
}

// ─── Tick diário (vista diária) ────────────────────────────────────────────────

function XTickDiario({ x, y, payload, index, visibleTicksCount }: any) {
  const val = payload?.value as string
  if (!val) return null
  // Mostra 1 tick a cada ~7 dias; calcula a partir do total de pontos
  const step = Math.max(1, Math.round(visibleTicksCount / 9))
  if (index % step !== 0) return null
  const label = format(parseISO(val), "dd/MM")
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle"
        fill="hsl(var(--muted-foreground))" fontSize={10}>{label}</text>
    </g>
  )
}

// ─── Tooltip mensal ────────────────────────────────────────────────────────────

function TooltipMensal({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  const secchi: number | null = p?.secchi ?? null
  const chuva: number = p?.pluviometria ?? 0
  const date = p?.periodo
    ? format(parseISO(`${p.periodo}-01`), "MMMM 'de' yyyy", { locale: ptBR })
    : ""
  const label = date.charAt(0).toUpperCase() + date.slice(1)
  const qc = secchi === null ? "hsl(var(--muted-foreground))"
    : secchi < 0.5 ? "#ef4444" : secchi < 1.5 ? "#f97316" : secchi < 3 ? "#22c55e" : "#06b6d4"
  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[180px] space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <Droplets className="w-3 h-3 text-blue-400 flex-none" />
        <span className="text-sm font-semibold text-blue-400">{chuva.toFixed(0)}</span>
        <span className="text-xs text-muted-foreground">mm de chuva</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <Eye className="w-3 h-3 flex-none" style={{ color: qc }} />
        <span className="text-sm font-semibold" style={{ color: qc }}>
          {secchi !== null ? `${secchi.toFixed(2)} m` : "—"}
        </span>
        <span className="text-xs text-muted-foreground">Secchi</span>
      </div>
    </div>
  )
}

// ─── Tooltip diário ────────────────────────────────────────────────────────────

function TooltipDiario({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  const secchi: number | null = p?.secchi ?? null
  const chuva: number = p?.pluviometria ?? 0
  const date = p?.dateStr
    ? format(parseISO(p.dateStr), "dd 'de' MMMM yyyy", { locale: ptBR })
    : ""
  const label = date.charAt(0).toUpperCase() + date.slice(1)
  const qc = secchi === null ? "hsl(var(--muted-foreground))"
    : secchi < 0.5 ? "#ef4444" : secchi < 1.5 ? "#f97316" : secchi < 3 ? "#22c55e" : "#06b6d4"
  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[190px] space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <Droplets className="w-3 h-3 text-blue-400 flex-none" />
        <span className="text-sm font-semibold text-blue-400">{chuva.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">mm de chuva</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <Eye className="w-3 h-3 flex-none" style={{ color: qc }} />
        <span className="text-sm font-semibold" style={{ color: qc }}>
          {secchi !== null ? `${secchi.toFixed(2)} m` : "—"}
        </span>
        <span className="text-xs text-muted-foreground">Secchi</span>
      </div>
      {secchi === null && (
        <p className="text-[10px] text-muted-foreground italic">Sem leitura de Secchi neste dia</p>
      )}
      {secchi !== null && chuva === 0 && (
        <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
          ☀ Sem chuva — transparência não afetada por precipitação
        </p>
      )}
      {secchi !== null && chuva > 0 && secchi < 1.5 && (
        <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
          ⚠ Chuva com baixa transparência — possível turvamento
        </p>
      )}
      {secchi !== null && chuva > 0 && secchi >= 1.5 && (
        <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
          ✓ Chuva presente mas água ainda transparente
        </p>
      )}
    </div>
  )
}

// ─── Tooltip scatter ───────────────────────────────────────────────────────────

function TooltipScatter({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const dateLabel = d?.periodo
    ? format(parseISO(`${d.periodo}-01`), "MMM/yy", { locale: ptBR }).replace(".", "")
    : d?.dateStr
    ? format(parseISO(d.dateStr), "dd/MM/yy")
    : ""
  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-3 py-2 min-w-[150px]">
      <p className="text-[11px] font-semibold text-muted-foreground mb-1">{dateLabel}</p>
      <p className="text-xs"><span className="text-blue-400 font-semibold">{d.x.toFixed(1)} mm</span> de chuva</p>
      <p className="text-xs"><span className="text-cyan-400 font-semibold">{d.y.toFixed(2)} m</span> Secchi</p>
    </div>
  )
}

// ─── Toggle de vista ───────────────────────────────────────────────────────────

type ViewMode = "temporal" | "diario" | "correlacao"

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { v: ViewMode; label: string }[] = [
    { v: "temporal",   label: "Mensal"        },
    { v: "diario",     label: "Diário (60 d)" },
    { v: "correlacao", label: "Correlação"    },
  ]
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/60">
      {options.map(({ v, label }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            value === v
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Gráfico composto compartilhado ───────────────────────────────────────────

interface CompostoProps {
  data: any[]
  xKey: string
  XTick: React.ComponentType<any>
  TooltipComp: React.ComponentType<any>
  gradId: string
  extraChildren?: React.ReactNode
}

function GraficoComposto({ data, xKey, XTick, TooltipComp, gradId, extraChildren }: CompostoProps) {
  const yMaxChuva = useMemo(() => {
    const m = Math.max(...data.map((d) => d.pluviometria ?? 0), 1)
    return Math.ceil((m * 1.2) / 10) * 10
  }, [data])

  const yMaxSecchi = useMemo(() => {
    const vals = data.map((d) => d.secchi).filter((v): v is number => v !== null)
    const m = vals.length ? Math.max(...vals) : 4
    return Math.max(4, Math.ceil((m * 1.25) / 0.5) * 0.5)
  }, [data])

  return (
    <ChartContainer
      config={{
        pluviometria: { label: "Chuva (mm)", color: "hsl(210, 80%, 65%)" },
        secchi:       { label: "Secchi (m)", color: "#06b6d4" },
      }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 48, left: 0, bottom: 24 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.15} />
              <stop offset="90%" stopColor="#06b6d4" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />

          {extraChildren}

          <XAxis dataKey={xKey} tick={<XTick />} tickLine={false} axisLine={false} interval={0} height={36} />

          <YAxis yAxisId="secchi" domain={[0, yMaxSecchi]}
            tickLine={false} axisLine={false}
            tick={{ fontSize: 10, fill: "#06b6d4" }}
            width={38} unit=" m" tickCount={5}
          />
          <YAxis yAxisId="chuva" orientation="right"
            domain={[0, yMaxChuva]} reversed
            tickLine={false} axisLine={false}
            tick={{ fontSize: 10, fill: "hsl(210, 80%, 65%)" }}
            width={44} unit=" mm" tickCount={5}
          />

          <Tooltip content={<TooltipComp />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }} />

          <Bar yAxisId="chuva" dataKey="pluviometria"
            fill="hsl(210, 80%, 65%)" fillOpacity={0.5}
            radius={[0, 0, 3, 3]} maxBarSize={22}
          />
          <Area yAxisId="secchi" type="monotone" dataKey="secchi"
            stroke="#06b6d4" strokeWidth={2.5}
            fill={`url(#${gradId})`}
            connectNulls={false} dot={false}
            activeDot={{ r: 5, fill: "#06b6d4", stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// ─── Vista mensal ──────────────────────────────────────────────────────────────

function VistaMensal({ data }: { data: any[] }) {
  const yearMarkers = useMemo(
    () => data.filter((d) => d.isYearStart && d.year > 2024).map((d) => d.periodo),
    [data],
  )
  return (
    <GraficoComposto
      data={data}
      xKey="periodo"
      XTick={XTickMensal}
      TooltipComp={TooltipMensal}
      gradId="secchiGradMensal"
      extraChildren={yearMarkers.map((p) => (
        <ReferenceLine key={p} x={p} yAxisId="secchi"
          stroke="hsl(var(--muted-foreground))" strokeOpacity={0.25} strokeDasharray="4 3" />
      ))}
    />
  )
}

// ─── Vista diária ──────────────────────────────────────────────────────────────

function VistaDiaria({ data }: { data: any[] }) {
  return (
    <GraficoComposto
      data={data}
      xKey="dateStr"
      XTick={XTickDiario}
      TooltipComp={TooltipDiario}
      gradId="secchiGradDiario"
    />
  )
}

// ─── Vista correlação ──────────────────────────────────────────────────────────

function VistaCorrelacao({ pairs, r, reg, scope }: {
  pairs: { x: number; y: number; periodo?: string; dateStr?: string }[]
  r: number
  reg: { slope: number; intercept: number } | null
  scope: "mensal" | "diario"
}) {
  const xMax = useMemo(() => {
    const m = Math.max(...pairs.map((p) => p.x), 50)
    return Math.ceil((m * 1.15) / 10) * 10
  }, [pairs])

  const yMax = useMemo(() => {
    const m = Math.max(...pairs.map((p) => p.y), 4)
    return Math.max(4, Math.ceil((m * 1.25) / 0.5) * 0.5)
  }, [pairs])

  const trendLine = useMemo(() => {
    if (!reg) return []
    return [
      { x: 0,    y: Math.max(0, reg.intercept) },
      { x: xMax, y: Math.max(0, reg.slope * xMax + reg.intercept) },
    ]
  }, [reg, xMax])

  const rColor = correlationLabel(r).color

  const interpretation = Math.abs(r) >= 0.7
    ? "A chuva explica fortemente a variação da transparência."
    : Math.abs(r) >= 0.4
    ? "Existe relação moderada. Outros fatores também influenciam."
    : "Relação fraca. A turbidez pode ter causas além da chuva (uso do solo, desmatamento)."

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground mb-0.5">Pearson r ({scope === "diario" ? "diário" : "mensal"})</p>
          <span className="text-3xl font-bold tabular-nums" style={{ color: rColor }}>{r.toFixed(2)}</span>
          <p className="text-xs font-medium mt-0.5" style={{ color: rColor }}>{correlationLabel(r).text}</p>
        </div>
        <div className="h-12 w-px bg-border" />
        <p className="text-[11px] text-muted-foreground max-w-[220px] leading-snug text-center">
          {interpretation}
          {scope === "diario" && " No diário, o lag de 1–2 dias entre chuva e turvamento pode enfraquecer a correlação."}
        </p>
      </div>

      <ChartContainer
        config={{ secchi: { label: "Secchi (m)", color: "#06b6d4" } }}
        className="h-[240px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis type="number" dataKey="x" domain={[0, xMax]}
              tickLine={false} axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit=" mm"
              label={{ value: "Chuva (mm)", position: "insideBottom", offset: -16, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis type="number" dataKey="y" domain={[0, yMax]}
              tickLine={false} axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit=" m" width={42}
              label={{ value: "Secchi (m)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<TooltipScatter />} cursor={{ strokeDasharray: "3 3" }} />
            {trendLine.length === 2 && (
              <ReferenceLine
                segment={[{ x: trendLine[0].x, y: trendLine[0].y }, { x: trendLine[1].x, y: trendLine[1].y }]}
                stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeWidth={1.5} strokeOpacity={0.6}
              />
            )}
            <Scatter data={pairs} fill="#06b6d4" fillOpacity={0.7} stroke="#06b6d4" strokeOpacity={0.3} r={scope === "diario" ? 4 : 5} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>
      <p className="text-center text-[10px] text-muted-foreground/60">
        Cada ponto = {scope === "diario" ? "um dia com leitura" : "um mês"}. Linha tracejada = regressão linear.
      </p>
    </div>
  )
}

// ─── Badge de correlação ───────────────────────────────────────────────────────

function BadgeCorrelacao({ r, label }: { r: number; label: string }) {
  const corr = correlationLabel(r)
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/30">
      <TrendingDown className="w-4 h-4 flex-none" style={{ color: corr.color }} />
      <div>
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="text-xs font-bold leading-tight" style={{ color: corr.color }}>
          r = {r.toFixed(2)} — {corr.text}
        </p>
      </div>
    </div>
  )
}

// ─── Legenda do gráfico composto ───────────────────────────────────────────────

function LegendaComposto() {
  return (
    <>
      <div className="flex items-center justify-center gap-6 mt-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-3 rounded-sm" style={{ background: "hsl(210,80%,65%)", opacity: 0.6 }} />
          <span className="text-[11px] text-muted-foreground">Chuva (mm) — eixo superior invertido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded" style={{ background: "#06b6d4" }} />
          <span className="text-[11px] text-muted-foreground">Secchi (m) — eixo inferior</span>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
        Quando as barras de chuva descem (invertidas), observe se o Secchi também cai — isso indica turvamento.
      </p>
    </>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function GraficoSaudeRio() {
  const [view, setView] = useState<ViewMode>("temporal")

  // ── Dados mensais ────────────────────────────────────────────────────────────
  const [secchiRaw, setSecchiRaw] = useState<{ periodo: string; secchi: number | null }[]>([])
  const [chuvaRaw,  setChuvaRaw]  = useState<{ periodo: string; pluviometria: number }[]>([])
  const [loadingMes, setLoadingMes] = useState(true)
  const [errorMes,   setErrorMes]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/balneario-municipal/historico/secchi").then((r) => r.json()),
      fetch("/api/balneario-municipal/historico/pluviometria").then((r) => r.json()),
    ])
      .then(([s, c]) => {
        if (s?.success) setSecchiRaw(s.data)
        else setErrorMes("Falha ao carregar Secchi mensal")
        if (c?.success) setChuvaRaw(c.data)
        else setErrorMes("Falha ao carregar chuva mensal")
      })
      .catch(() => setErrorMes("Erro de conexão"))
      .finally(() => setLoadingMes(false))
  }, [])

  const combined = useMemo(() => {
    const chuvaMap = Object.fromEntries(chuvaRaw.map((d) => [d.periodo, d.pluviometria]))
    return secchiRaw.map((d) => {
      const [yr, mo] = d.periodo.split("-").map(Number)
      return {
        periodo:      d.periodo,
        secchi:       d.secchi,
        pluviometria: chuvaMap[d.periodo] ?? 0,
        isYearStart:  mo === 1,
        year:         yr,
      }
    })
  }, [secchiRaw, chuvaRaw])

  const mensalPairs = useMemo(
    () =>
      combined
        .filter((d): d is typeof d & { secchi: number } => d.secchi !== null)
        .map((d) => ({ x: d.pluviometria, y: d.secchi, periodo: d.periodo })),
    [combined],
  )
  const rMensal  = useMemo(() => pearsonR(mensalPairs.map((p) => p.x), mensalPairs.map((p) => p.y)), [mensalPairs])
  const regMensal = useMemo(() => linearRegression(mensalPairs.map((p) => [p.x, p.y])), [mensalPairs])

  // ── Dados diários (60 dias) ──────────────────────────────────────────────────
  const [dailyRaw,    setDailyRaw]    = useState<any[]>([])
  const [loadingDia,  setLoadingDia]  = useState(false)
  const [errorDia,    setErrorDia]    = useState<string | null>(null)
  const [dailyLoaded, setDailyLoaded] = useState(false)

  useEffect(() => {
    if (view !== "diario" && view !== "correlacao") return
    if (dailyLoaded) return

    setLoadingDia(true)
    setErrorDia(null)

    const end   = new Date()
    const start = subDays(end, 60)
    const p = new URLSearchParams({
      startDate: fmtDate(start),
      endDate:   fmtDate(end),
    })

    fetch(`/api/balneario-municipal/daily?${p}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setDailyRaw(json.data)
        else setErrorDia("Falha ao carregar dados diários")
      })
      .catch(() => setErrorDia("Erro de conexão"))
      .finally(() => {
        setLoadingDia(false)
        setDailyLoaded(true)
      })
  }, [view, dailyLoaded])

  const toN = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : null }

  const dailyCombined = useMemo(
    () =>
      dailyRaw
        .filter((r) => !!r.data)
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((r) => ({
          dateStr:      r.data as string,
          secchi:       toN(r.secchiVertical),
          pluviometria: toN(r.pluviometria) ?? 0,
        })),
    [dailyRaw],
  )

  const diarioPairs = useMemo(
    () =>
      dailyCombined
        .filter((d): d is typeof d & { secchi: number } => d.secchi !== null)
        .map((d) => ({ x: d.pluviometria, y: d.secchi, dateStr: d.dateStr })),
    [dailyCombined],
  )
  const rDiario   = useMemo(() => pearsonR(diarioPairs.map((p) => p.x), diarioPairs.map((p) => p.y)), [diarioPairs])
  const regDiario = useMemo(() => linearRegression(diarioPairs.map((p) => [p.x, p.y])), [diarioPairs])

  // ── Score de saúde (mensal, mais representativo) ─────────────────────────────
  const avgSecchi = useMemo(() => {
    const vals = mensalPairs.map((p) => p.y)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [mensalPairs])

  const score  = healthScore(avgSecchi)
  const health = healthLabel(score)

  // ── Estado de loading/error ───────────────────────────────────────────────────
  const loading = view === "diario" ? loadingDia : view === "correlacao" ? loadingDia : loadingMes
  const error   = view === "diario" ? errorDia   : view === "correlacao" ? errorDia   : errorMes

  if (loadingMes && view === "temporal") {
    return (
      <div className="h-[340px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          Cruzando dados…
        </div>
      </div>
    )
  }

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

          {/* Title */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-none mt-0.5">
              <Activity className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Saúde do Rio — Relação Chuva × Transparência
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {view === "diario"
                  ? "Balneário Municipal · Dados diários · últimos 60 dias"
                  : "Balneário Municipal · Médias mensais · Jan/2024–" + new Date().getFullYear()}
              </CardDescription>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Score de saúde */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${health.bg} border-transparent`}>
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none"
                    stroke={health.color} strokeWidth="3"
                    strokeDasharray={`${score} 100`} strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: health.color }}>
                  {Math.round(score)}
                </span>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">Saúde do rio</p>
                <p className="text-xs font-bold leading-tight" style={{ color: health.color }}>{health.text}</p>
              </div>
            </div>

            {/* Correlação mensal sempre visível */}
            <BadgeCorrelacao r={rMensal} label="Correlação mensal" />

            {/* Correlação diária — aparece quando há dados diários */}
            {dailyLoaded && diarioPairs.length >= 3 && (
              <BadgeCorrelacao r={rDiario} label="Correlação diária" />
            )}
          </div>
        </div>

        <div className="mt-3">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-2">
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              {view === "diario" ? "Carregando dados diários…" : "Cruzando dados…"}
            </div>
          </div>
        ) : error ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : view === "temporal" ? (
          <>
            <VistaMensal data={combined} />
            <LegendaComposto />
          </>
        ) : view === "diario" ? (
          dailyCombined.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Nenhum dado nos últimos 60 dias</p>
            </div>
          ) : (
            <>
              <VistaDiaria data={dailyCombined} />
              <LegendaComposto />
            </>
          )
        ) : (
          // Correlação — usa mensal por padrão, mas deixa comparar com diário
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Escala mensal
              </p>
              <VistaCorrelacao pairs={mensalPairs} r={rMensal} reg={regMensal} scope="mensal" />
            </div>
            {dailyLoaded && diarioPairs.length >= 3 && (
              <div className="border-t border-border pt-6">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Escala diária (60 dias)
                </p>
                <VistaCorrelacao pairs={diarioPairs} r={rDiario} reg={regDiario} scope="diario" />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
