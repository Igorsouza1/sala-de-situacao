"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Flame } from "lucide-react"
import { useFogo } from "@/context/FogoContext"

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function focoColor(count: number): string {
  if (count === 0)  return "hsl(var(--muted))"
  if (count <= 5)   return "#f97316"
  if (count <= 20)  return "#ef4444"
  return                   "#7f1d1d"
}

function focoLabel(count: number): string {
  if (count === 0)  return "Sem focos"
  if (count <= 5)   return "Baixo"
  if (count <= 20)  return "Moderado"
  return                   "Crítico"
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const value: number = d?.focos ?? 0
  const color = focoColor(value)
  return (
    <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-xl px-4 py-3 min-w-[160px]">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">{d?.mes}</p>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ color: value === 0 ? "hsl(var(--muted-foreground))" : color }}
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground font-medium">focos</span>
      </div>
      <p className="text-[11px] font-medium" style={{ color: value === 0 ? "hsl(var(--muted-foreground))" : color }}>
        {focoLabel(value)}
      </p>
    </div>
  )
}

function StatBadge({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

export function GraficoFogo() {
  const { filteredFogoData, isLoading, error, selectedYear } = useFogo()

  const data = useMemo(
    () => MESES.map((mes, i) => ({ mes, focos: filteredFogoData[i] ?? 0 })),
    [filteredFogoData],
  )

  const stats = useMemo(() => {
    const total = data.reduce((s, d) => s + d.focos, 0)
    const peak = data.reduce((a, b) => (b.focos > a.focos ? b : a), data[0])
    const mesesAtivos = data.filter((d) => d.focos > 0).length
    return { total, peak, mesesAtivos }
  }, [data])

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-sm w-full">
        <CardContent className="h-[340px] flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            Carregando…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border bg-card shadow-sm w-full">
        <CardContent className="h-[340px] flex items-center justify-center">
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-2 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

          {/* Title */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-none mt-0.5">
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Focos de Incêndio
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Distribuição mensal · {selectedYear === "todos" ? "Período completo" : selectedYear} · Satélite VIIRS
              </CardDescription>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
            <StatBadge label="Total" value={String(stats.total)} unit="focos" />
            <StatBadge label="Pico" value={`${stats.peak.focos} (${stats.peak.mes})`} />
            <StatBadge label="Meses ativos" value={String(stats.mesesAtivos)} />
          </div>

        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-4">
        <ChartContainer
          config={{ focos: { label: "Focos de Incêndio", color: "#ef4444" } }}
          className="h-[260px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={32}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4, radius: 4 }}
              />
              <Bar dataKey="focos" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {data.map((d, i) => (
                  <Cell key={i} fill={focoColor(d.focos)} fillOpacity={d.focos === 0 ? 0.3 : 0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1 flex-wrap">
          {[
            { color: "hsl(var(--muted-foreground))", label: "Sem focos",       opacity: 0.4 },
            { color: "#f97316",                       label: "Baixo (1–5)"               },
            { color: "#ef4444",                       label: "Moderado (6–20)"            },
            { color: "#7f1d1d",                       label: "Crítico (> 20)"             },
          ].map(({ color, label, opacity }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-none" style={{ background: color, opacity: opacity ?? 0.85 }} />
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
