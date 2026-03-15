"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
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
import { Waves, TrendingUp, TrendingDown, Minus } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DataPoint {
  periodo: string       // "2022-01"
  nivelAgua: number | null
  // enriched client-side
  label: string         // "Jan/22"
  isYearStart: boolean
  year: number
}

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const point: DataPoint = payload[0]?.payload
  const value: number | null = payload[0]?.value ?? null

  const date = point?.periodo
    ? format(parseISO(`${point.periodo}-01`), "MMMM 'de' yyyy", { locale: ptBR })
    : label

  const capitalized = date.charAt(0).toUpperCase() + date.slice(1)

  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[160px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">{capitalized}</p>
      {value !== null ? (
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-blue-500 tracking-tight">
            {value.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground font-medium">m</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic">Sem coleta</p>
      )}
    </div>
  )
}

// ─── Tick customizado para o eixo X ──────────────────────────────────────────

function CustomXTick({ x, y, payload }: any) {
  const point = payload?.value as string
  if (!point) return null

  const [yr, mo] = point.split("-").map(Number)
  const isJan = mo === 1

  const monthAbbr = format(new Date(yr, mo - 1, 1), "MMM", { locale: ptBR })
    .replace(".", "")
    .slice(0, 3)

  if (isJan) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={14}
          textAnchor="middle"
          fill="hsl(var(--foreground))"
          fontSize={11}
          fontWeight={700}
        >
          {yr}
        </text>
      </g>
    )
  }

  // Only show every 3rd month to avoid crowding
  if (mo % 3 !== 0) return null

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={14}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={10}
      >
        {monthAbbr}
      </text>
    </g>
  )
}

// ─── Stats header ─────────────────────────────────────────────────────────────

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

export function GraficoNivelRioBalneario() {
  const [raw, setRaw] = useState<{ periodo: string; nivelAgua: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/balneario-municipal/historico/nivel-rio")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setRaw(json.data)
        else setError("Falha ao carregar dados")
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false))
  }, [])

  // Enriquecer os dados com labels e flags
  const data: DataPoint[] = useMemo(
    () =>
      raw.map((d) => {
        const [yr, mo] = d.periodo.split("-").map(Number)
        const dateObj = new Date(yr, mo - 1, 1)
        const label = format(dateObj, "MMM/yy", { locale: ptBR })
          .replace(".", "")
        return {
          ...d,
          label,
          isYearStart: mo === 1,
          year: yr,
        }
      }),
    [raw],
  )

  // Estatísticas
  const stats = useMemo(() => {
    const valid = data.filter((d) => d.nivelAgua !== null).map((d) => d.nivelAgua as number)
    if (!valid.length) return null
    const max = Math.max(...valid)
    const min = Math.min(...valid)
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length
    const last = data.filter((d) => d.nivelAgua !== null).at(-1)
    const prev = data.filter((d) => d.nivelAgua !== null).at(-2)
    const trend =
      last && prev
        ? last.nivelAgua! > prev.nivelAgua!
          ? "alta"
          : last.nivelAgua! < prev.nivelAgua!
          ? "baixa"
          : "estavel"
        : "estavel"
    return { max, min, avg, last, trend }
  }, [data])

  // Anos com marcador vertical
  const yearMarkers = useMemo(
    () => data.filter((d) => d.isYearStart && d.year > 2024).map((d) => d.periodo),
    [data],
  )

  // Y domain com padding
  const yDomain = useMemo(() => {
    if (!stats) return [0, 100]
    const pad = (stats.max - stats.min) * 0.2 || 10
    return [Math.max(0, Math.floor(stats.min - pad)), Math.ceil(stats.max + pad)]
  }, [stats])

  if (loading) {
    return (
      <div className="h-[340px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Carregando histórico…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[340px] flex items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const TrendIcon =
    stats?.trend === "alta" ? TrendingUp : stats?.trend === "baixa" ? TrendingDown : Minus
  const trendColor =
    stats?.trend === "alta"
      ? "text-emerald-500"
      : stats?.trend === "baixa"
      ? "text-red-500"
      : "text-muted-foreground"

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Title block */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-none mt-0.5">
              <Waves className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Nível da Água — Série Histórica
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Balneário Municipal · Médias mensais · Jan/2024–{new Date().getFullYear()}
              </CardDescription>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex items-center gap-5 sm:gap-6 text-right flex-wrap">
              <StatBadge label="Máxima" value={stats.max.toFixed(1)} unit="m" />
              <StatBadge label="Mínima" value={stats.min.toFixed(1)} unit="m" />
              <StatBadge label="Média" value={stats.avg.toFixed(1)} unit="m" />
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-[11px] text-muted-foreground">Tendência</span>
                <div className={`flex items-center gap-1 ${trendColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="text-sm font-semibold capitalize">{stats.trend}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-4">
        <ChartContainer
          config={{ nivelAgua: { label: "Nível da Água (cm)", color: "hsl(217, 91%, 60%)" } }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 24 }}
            >
              {/* Gradient fill */}
              <defs>
                <linearGradient id="nivelRioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.25} />
                  <stop offset="75%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />

              {/* Marcadores de ano */}
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
                domain={yDomain}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}`}
                width={38}
                unit=" m"
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "hsl(217, 91%, 60%)",
                  strokeWidth: 1.5,
                  strokeDasharray: "4 3",
                  strokeOpacity: 0.6,
                }}
              />

              <Area
                type="monotone"
                dataKey="nivelAgua"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2.5}
                fill="url(#nivelRioGradient)"
                connectNulls={false}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "hsl(217, 91%, 60%)",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legenda de referência */}
        <div className="flex items-center justify-center gap-6 mt-1">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-0.5 rounded"
              style={{ background: "hsl(217, 91%, 60%)" }}
            />
            <span className="text-[11px] text-muted-foreground">Nível médio mensal (m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px border-t border-dashed border-muted-foreground/40" />
            <span className="text-[11px] text-muted-foreground">Início do ano</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
