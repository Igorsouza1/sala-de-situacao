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
  ReferenceArea,
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
import { Droplets } from "lucide-react"

// ─── Faixas de turbidez ───────────────────────────────────────────────────────
// Thresholds para o Deque de Pedras (mergulho em água clara)
const QUALITY_BANDS = [
  { y1: 0,   y2: 3,   fill: "#10b98118", label: "Excelente",  textColor: "#10b981", range: "0–3 NTU" },
  { y1: 3,   y2: 7,   fill: "#eab30818", label: "Boa",        textColor: "#eab308", range: "4–7 NTU" },
  { y1: 7,   y2: 15,  fill: "#f9731618", label: "Regular",    textColor: "#f97316", range: "8–15 NTU" },
  { y1: 15,  y2: 300, fill: "#ef444418", label: "Ruim",       textColor: "#ef4444", range: "> 15 NTU" },
]

function qualityFor(v: number | null): { label: string; color: string } {
  if (v === null) return { label: "Sem dado", color: "hsl(var(--muted-foreground))" }
  if (v <= 3)  return { label: "Excelente", color: "#10b981" }
  if (v <= 7)  return { label: "Boa",       color: "#eab308" }
  if (v <= 15) return { label: "Regular",   color: "#f97316" }
  return             { label: "Ruim",       color: "#ef4444" }
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  const value: number | null = payload[0]?.value ?? null
  const q = qualityFor(value)
  const date = point?.periodo
    ? format(parseISO(`${point.periodo}-01`), "MMMM 'de' yyyy", { locale: ptBR })
    : ""
  const capitalized = date.charAt(0).toUpperCase() + date.slice(1)
  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[180px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-2">{capitalized}</p>
      {value !== null ? (
        <>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-2xl font-bold tracking-tight" style={{ color: q.color }}>
              {value.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">NTU</span>
          </div>
          <p className="text-xs font-semibold" style={{ color: q.color }}>{q.label}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground italic">Sem coleta neste mês</p>
      )}
    </div>
  )
}

// ─── Tick eixo X ──────────────────────────────────────────────────────────────

function CustomXTick({ x, y, payload }: any) {
  const point = payload?.value as string
  if (!point) return null
  const [yr, mo] = point.split("-").map(Number)
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

// ─── Stat badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="flex flex-col items-end sm:items-start">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold" style={{ color: color ?? "hsl(var(--foreground))" }}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GraficoTurbidezDeque() {
  const [raw, setRaw] = useState<{ periodo: string; turbidez: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/deque-pedras/historico/turbidez")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setRaw(json.data)
        else setError("Falha ao carregar dados")
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false))
  }, [])

  const data = useMemo(
    () => raw.map((d) => {
      const [yr, mo] = d.periodo.split("-").map(Number)
      return { ...d, isYearStart: mo === 1, year: yr }
    }),
    [raw],
  )

  const stats = useMemo(() => {
    const valid = data.filter((d) => d.turbidez !== null).map((d) => d.turbidez as number)
    if (!valid.length) return null
    const max = Math.max(...valid)
    const min = Math.min(...valid)
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length
    const last = data.filter((d) => d.turbidez !== null).at(-1)
    return { max, min, avg, last }
  }, [data])

  const yearMarkers = useMemo(
    () => data.filter((d) => d.isYearStart && d.year > 2024).map((d) => d.periodo),
    [data],
  )

  const yMax = useMemo(() => {
    const m = stats?.max ?? 15
    return Math.max(20, Math.ceil((m * 1.2) / 5) * 5)
  }, [stats])

  if (loading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
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

  const lastQ = qualityFor(stats?.last?.turbidez ?? null)

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-none mt-0.5">
              <Droplets className="w-4 h-4 text-teal-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Turbidez — Série Histórica
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Deque de Pedras · Média mensal · Jan/2024–{new Date().getFullYear()}
              </CardDescription>
            </div>
          </div>
          {stats && (
            <div className="flex items-center gap-5 sm:gap-6 text-right flex-wrap">
              <StatBadge label="Máxima média" value={stats.max.toFixed(1)} unit="NTU" color="#ef4444" />
              <StatBadge label="Mínima média" value={stats.min.toFixed(1)} unit="NTU" color="#10b981" />
              <StatBadge label="Média geral" value={stats.avg.toFixed(1)} unit="NTU" />
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-[11px] text-muted-foreground">Última leitura</span>
                <span className="text-sm font-bold" style={{ color: lastQ.color }}>
                  {stats.last?.turbidez?.toFixed(1) ?? "—"} NTU — {lastQ.label}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-4">
        <ChartContainer
          config={{ turbidez: { label: "Turbidez (NTU)", color: "#10b981" } }}
          className="h-[260px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }} barCategoryGap="30%">

              {QUALITY_BANDS.map((band) => (
                <ReferenceArea
                  key={band.label}
                  y1={band.y1}
                  y2={Math.min(band.y2, yMax)}
                  fill={band.fill}
                  stroke="none"
                  ifOverflow="hidden"
                />
              ))}

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.4}
                vertical={false}
              />

              {[
                { y: 3,  label: "3 NTU — Boa",     color: "#eab308" },
                { y: 7,  label: "7 NTU — Regular",  color: "#f97316" },
                { y: 15, label: "15 NTU — Ruim",    color: "#ef4444" },
              ].filter((ref) => ref.y <= yMax).map((ref) => (
                <ReferenceLine
                  key={ref.y}
                  y={ref.y}
                  stroke={ref.color}
                  strokeWidth={1}
                  strokeDasharray="5 3"
                  strokeOpacity={0.7}
                  label={{
                    value: ref.label,
                    position: "insideTopRight",
                    fontSize: 9,
                    fill: ref.color,
                    dy: -3,
                  }}
                />
              ))}

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

              <XAxis dataKey="periodo" tick={<CustomXTick />} tickLine={false} axisLine={false} interval={0} height={36} />
              <YAxis
                domain={[0, yMax]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={42}
                unit=" NTU"
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.35, radius: 4 }} />

              <Bar dataKey="turbidez" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {data.map((entry, index) => {
                  const q = qualityFor(entry.turbidez)
                  return (
                    <Cell
                      key={index}
                      fill={entry.turbidez === null ? "hsl(var(--muted))" : q.color}
                      fillOpacity={entry.turbidez === null ? 0.3 : 0.85}
                    />
                  )
                })}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          {QUALITY_BANDS.map(({ textColor, label, range }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-none" style={{ background: textColor, opacity: 0.85 }} />
              <span className="text-[11px] text-muted-foreground">{range} — {label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
          Média mensal da turbidez no ponto de mergulho. Valores menores indicam água mais limpa e maior visibilidade subaquática.
        </p>
      </CardContent>
    </Card>
  )
}
