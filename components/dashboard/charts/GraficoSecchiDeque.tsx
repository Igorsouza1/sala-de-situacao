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
import { Eye } from "lucide-react"

// ─── Faixas de qualidade ──────────────────────────────────────────────────────
// Thresholds para o Deque de Pedras (mergulho — Secchi vertical)
const QUALITY_BANDS = [
  { y1: 0,   y2: 1,   fill: "#ef444418", label: "Turva",      textColor: "#ef4444" },
  { y1: 1,   y2: 3,   fill: "#f9731618", label: "Moderada",   textColor: "#f97316" },
  { y1: 3,   y2: 6,   fill: "#22c55e18", label: "Boa",        textColor: "#22c55e" },
  { y1: 6,   y2: 20,  fill: "#06b6d418", label: "Excelente",  textColor: "#06b6d4" },
]

function qualityFor(v: number | null): { label: string; color: string } {
  if (v === null) return { label: "Sem dado",   color: "hsl(var(--muted-foreground))" }
  if (v < 1)     return { label: "Turva",       color: "#ef4444" }
  if (v < 3)     return { label: "Moderada",    color: "#f97316" }
  if (v < 6)     return { label: "Boa",         color: "#22c55e" }
  return               { label: "Excelente",    color: "#06b6d4" }
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
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[190px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-2">{capitalized}</p>
      {value !== null ? (
        <>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold tracking-tight" style={{ color: q.color }}>
              {value.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground font-medium">m</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-3 rounded-sm overflow-hidden bg-muted/60" style={{ height: 48 }}>
              <div
                className="absolute bottom-0 left-0 right-0 rounded-sm"
                style={{ height: `${Math.min(100, (value / 10) * 100)}%`, background: q.color, opacity: 0.85 }}
              />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: q.color }}>{q.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                {value < 1 ? "Visibilidade muito limitada" : value < 3 ? "Visibilidade reduzida" : value < 6 ? "Boa visibilidade para mergulho" : "Água cristalina"}
              </p>
            </div>
          </div>
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

export function GraficoSecchiDeque() {
  const [raw, setRaw] = useState<{ periodo: string; secchi: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/deque-pedras/historico/secchi")
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
    const valid = data.filter((d) => d.secchi !== null).map((d) => d.secchi as number)
    if (!valid.length) return null
    const max = Math.max(...valid)
    const min = Math.min(...valid)
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length
    const last = data.filter((d) => d.secchi !== null).at(-1)
    const maxPoint = data.find((d) => d.secchi === max)
    const maxLabel = maxPoint
      ? format(parseISO(`${maxPoint.periodo}-01`), "MMM/yy", { locale: ptBR }).replace(".", "")
      : "—"
    return { max, min, avg, last, maxLabel }
  }, [data])

  const yearMarkers = useMemo(
    () => data.filter((d) => d.isYearStart && d.year > 2024).map((d) => d.periodo),
    [data],
  )

  const yMax = useMemo(() => {
    const m = stats?.max ?? 6
    return Math.max(8, Math.ceil((m * 1.25) / 0.5) * 0.5)
  }, [stats])

  if (loading) {
    return (
      <div className="h-[320px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          Carregando histórico…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[320px] flex items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const lastQ = qualityFor(stats?.last?.secchi ?? null)

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-none mt-0.5">
              <Eye className="w-4 h-4 text-cyan-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Disco de Secchi — Série Histórica
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Deque de Pedras · Transparência da água (média mensal) · Jan/2024–{new Date().getFullYear()}
              </CardDescription>
            </div>
          </div>
          {stats && (
            <div className="flex items-center gap-5 sm:gap-6 text-right flex-wrap">
              <StatBadge label="Melhor registro" value={`${stats.max.toFixed(2)} (${stats.maxLabel})`} unit="m" color="#06b6d4" />
              <StatBadge label="Mínimo" value={stats.min.toFixed(2)} unit="m" />
              <StatBadge label="Média" value={stats.avg.toFixed(2)} unit="m" />
              <div className="flex flex-col items-end sm:items-start">
                <span className="text-[11px] text-muted-foreground">Última leitura</span>
                <span className="text-sm font-bold" style={{ color: lastQ.color }}>
                  {stats.last?.secchi?.toFixed(2) ?? "—"} m — {lastQ.label}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-4">
        <ChartContainer
          config={{ secchi: { label: "Secchi (m)", color: "#06b6d4" } }}
          className="h-[300px] w-full"
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

              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />

              {[
                { y: 1, label: "1 m — Moderada", color: "#f97316" },
                { y: 3, label: "3 m — Boa",      color: "#22c55e" },
                { y: 6, label: "6 m — Excelente", color: "#06b6d4" },
              ].filter((ref) => ref.y <= yMax).map((ref) => (
                <ReferenceLine
                  key={ref.y}
                  y={ref.y}
                  stroke={ref.color}
                  strokeWidth={1}
                  strokeDasharray="5 3"
                  strokeOpacity={0.7}
                  label={{ value: ref.label, position: "insideTopRight", fontSize: 9, fill: ref.color, dy: -3 }}
                />
              ))}

              {yearMarkers.map((periodo) => (
                <ReferenceLine
                  key={periodo}
                  x={periodo}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.3}
                  strokeDasharray="4 3"
                  label={{ value: periodo.slice(0, 4), position: "insideTopLeft", fontSize: 10, fill: "hsl(var(--muted-foreground))", dy: -4 }}
                />
              ))}

              <XAxis dataKey="periodo" tick={<CustomXTick />} tickLine={false} axisLine={false} interval={0} height={36} />
              <YAxis
                domain={[0, yMax]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={42}
                unit=" m"
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.35, radius: 4 }} />

              <Bar dataKey="secchi" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {data.map((entry, index) => {
                  const q = qualityFor(entry.secchi)
                  return (
                    <Cell
                      key={index}
                      fill={entry.secchi === null ? "hsl(var(--muted))" : q.color}
                      fillOpacity={entry.secchi === null ? 0.3 : 0.85}
                    />
                  )
                })}
              </Bar>

            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          {[
            { color: "#ef4444", label: "< 1 m — Turva" },
            { color: "#f97316", label: "1–3 m — Moderada" },
            { color: "#22c55e", label: "3–6 m — Boa" },
            { color: "#06b6d4", label: "> 6 m — Excelente" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-none" style={{ background: color, opacity: 0.85 }} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/60 mt-3">
          O disco de Secchi mede a transparência da água. Valores mais altos indicam maior visibilidade para mergulho no Deque de Pedras.
        </p>
      </CardContent>
    </Card>
  )
}
