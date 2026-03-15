"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
} from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { CloudRain } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataPoint {
  periodo: string       // "2024-01"
  pluviometria: number  // sempre >= 0
  isYearStart: boolean
  year: number
}

// ─── Helpers de cor ───────────────────────────────────────────────────────────

// Gradiente semântico: seco → moderado → intenso
function barColor(mm: number): string {
  if (mm === 0)   return "hsl(210, 20%, 82%)"   // cinza-azulado (sem chuva)
  if (mm < 50)    return "hsl(210, 80%, 68%)"   // azul claro
  if (mm < 120)   return "hsl(217, 91%, 55%)"   // azul médio
  return            "hsl(225, 80%, 42%)"          // azul escuro (muito intenso)
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null

  const point: DataPoint = payload[0]?.payload
  const value: number = payload[0]?.value ?? 0

  const date = point?.periodo
    ? format(parseISO(`${point.periodo}-01`), "MMMM 'de' yyyy", { locale: ptBR })
    : ""
  const capitalized = date.charAt(0).toUpperCase() + date.slice(1)

  const label =
    value === 0
      ? "Sem registros de chuva"
      : value < 50
      ? "Precipitação baixa"
      : value < 120
      ? "Precipitação moderada"
      : "Precipitação intensa"

  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[170px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">{capitalized}</p>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: barColor(value) === "hsl(210, 20%, 82%)" ? "hsl(var(--muted-foreground))" : barColor(value) }}
        >
          {value.toFixed(1)}
        </span>
        <span className="text-xs text-muted-foreground font-medium">mm</span>
      </div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── Tick do eixo X ──────────────────────────────────────────────────────────

function CustomXTick({ x, y, payload }: any) {
  const point = payload?.value as string
  if (!point) return null
  const [yr, mo] = point.split("-").map(Number)
  const isJan = mo === 1

  if (isJan) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="middle"
          fill="hsl(var(--foreground))" fontSize={11} fontWeight={700}>
          {yr}
        </text>
      </g>
    )
  }
  if (mo % 3 !== 0) return null
  const monthAbbr = format(new Date(yr, mo - 1, 1), "MMM", { locale: ptBR }).replace(".", "").slice(0, 3)
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle"
        fill="hsl(var(--muted-foreground))" fontSize={10}>
        {monthAbbr}
      </text>
    </g>
  )
}

// ─── Stat badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col items-end sm:items-start">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GraficoPluviometriaBalneario() {
  const [raw, setRaw] = useState<{ periodo: string; pluviometria: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/balneario-municipal/historico/pluviometria")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setRaw(json.data)
        else setError("Falha ao carregar dados")
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false))
  }, [])

  const data: DataPoint[] = useMemo(
    () =>
      raw.map((d) => {
        const [yr, mo] = d.periodo.split("-").map(Number)
        return { ...d, isYearStart: mo === 1, year: yr }
      }),
    [raw],
  )

  const stats = useMemo(() => {
    const nonZero = data.filter((d) => d.pluviometria > 0).map((d) => d.pluviometria)
    if (!nonZero.length) return null
    const total = data.reduce((s, d) => s + d.pluviometria, 0)
    const max = Math.max(...nonZero)
    const wetMonths = nonZero.length
    const maxPoint = data.find((d) => d.pluviometria === max)
    const maxLabel = maxPoint
      ? format(parseISO(`${maxPoint.periodo}-01`), "MMM/yy", { locale: ptBR }).replace(".", "")
      : "—"
    return { total, max, wetMonths, maxLabel }
  }, [data])

  const yearMarkers = useMemo(
    () => data.filter((d) => d.isYearStart && d.year > 2024).map((d) => d.periodo),
    [data],
  )

  const yMax = useMemo(() => {
    const m = stats?.max ?? 50
    return Math.ceil((m * 1.2) / 20) * 20
  }, [stats])

  if (loading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Carregando histórico…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Title block */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-none mt-0.5">
              <CloudRain className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Pluviometria — Série Histórica
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Balneário Municipal · Acumulado mensal · Jan/2024–{new Date().getFullYear()}
              </CardDescription>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-5 sm:gap-6 text-right flex-wrap">
              <StatBadge label="Total acumulado" value={stats.total.toFixed(0)} unit="mm" />
              <StatBadge label="Máximo mensal" value={`${stats.max.toFixed(0)} (${stats.maxLabel})`} unit="mm" />
              <StatBadge label="Meses com chuva" value={String(stats.wetMonths)} />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-4">
        <ChartContainer
          config={{ pluviometria: { label: "Pluviometria (mm)", color: "hsl(217, 91%, 55%)" } }}
          className="h-[260px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }} barCategoryGap="30%">

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />

              {yearMarkers.map((periodo) => (
                <ReferenceLine
                  key={periodo}
                  x={periodo}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.3}
                  strokeDasharray="4 3"
                  label={{
                    value: periodo.slice(0, 4),
                    position: "insideTopLeft",
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                    dy: -4,
                  }}
                />
              ))}

              <XAxis
                dataKey="periodo"
                tick={<CustomXTick />}
                tickLine={false}
                axisLine={false}
                interval={0}
                height={36}
              />

              <YAxis
                domain={[0, yMax]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={42}
                unit=" mm"
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4, radius: 4 }}
              />

              <Bar dataKey="pluviometria" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={barColor(entry.pluviometria)} />
                ))}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legenda de intensidade */}
        <div className="flex items-center justify-center gap-4 mt-1 flex-wrap">
          {[
            { color: "hsl(210, 20%, 82%)", label: "Sem chuva" },
            { color: "hsl(210, 80%, 68%)", label: "< 50 mm" },
            { color: "hsl(217, 91%, 55%)", label: "50–120 mm" },
            { color: "hsl(225, 80%, 42%)", label: "> 120 mm" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-none" style={{ background: color }} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
