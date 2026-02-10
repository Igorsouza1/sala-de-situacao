"use client"

import {
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
} from "recharts"
import { format, parseISO, differenceInCalendarDays } from "date-fns"
import { useState, useMemo, useCallback, JSX } from "react"
import { useDailyDeque } from "@/context/DailyDequeContext"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SeriePonto, PresetKey, PresetValue } from "@/types/chart-types"


const PRESETS: Record<PresetKey, PresetValue> = {
  "7 d": 7,
  "15 d": 15,
  "30 d": 30,
}

// Fixed semantic colors for bands (transparency is handled in bands)
const BAND_COLORS = {
  excellent: "#10b981", // Green
  good: "#eab308",      // Yellow
  fair: "#f97316",      // Orange
  poor: "#ef4444",      // Red
}

const TURBIDEZ_BANDS = [
  // 🟢 0–3 NTU
  { y1: 0,  y2: 3,   color: `${BAND_COLORS.excellent}33`, label: "Flutuação excelente", range: "0–3 NTU" },
  // 🟡 4–7 NTU
  { y1: 3,  y2: 7,   color: `${BAND_COLORS.good}33`, label: "Boa – atenção",       range: "4–7 NTU" },
  // 🟠 8–15 NTU
  { y1: 7,  y2: 15,  color: `${BAND_COLORS.fair}33`, label: "Regular – informe",   range: "8–15 NTU" },
  // 🔴 >15 NTU
  { y1: 15, y2: 300, color: `${BAND_COLORS.poor}33`, label: "Experiência ruim",    range: ">15 NTU" },
]

export function GraficoTurbidezDiario(): JSX.Element {
  const { raw, isLoading, error } = useDailyDeque()

  const [presetDias, setPresetDias] = useState<PresetValue>(30) // Default 30 dias

  const handlePresetChange = useCallback((dias: PresetValue) => {
    setPresetDias(dias)
  }, [])

  const serieCompleta: SeriePonto[] = useMemo(() => {
    if (!raw.length) return []

    const sorted = raw.slice().sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    return sorted.map((entry) => {
      const safe = (v: any, dec = 2) => {
        const n = Number(v)
        return !isFinite(n) ? 0 : Number(n.toFixed(dec))
      }

      return {
        diaFmt: format(parseISO(entry.data), "dd/MM"),
        originalDate: entry.data,
        turbidez: safe(entry.turbidez, 2),
        turbidezMedia7d: 0, // Removido mas mantido para compatibilidade
        secchiVert: safe(entry.secchiVertical, 2),
        chuva: safe(entry.chuva, 1),
      }
    })
  }, [raw])

  const displayData = useMemo(() => {
    const maxDays = Math.min(presetDias || 30, 30) // Máximo 30 dias
    const start = Math.max(0, serieCompleta.length - maxDays)
    return serieCompleta.slice(start)
  }, [serieCompleta, presetDias])

  const lastInfo = useMemo(() => {
    if (!serieCompleta.length) return null
    const u = serieCompleta[serieCompleta.length - 1]
    const dias = differenceInCalendarDays(new Date(), new Date(u.originalDate))
    return { dias, dataFmt: format(parseISO(u.originalDate), "dd/MM/yyyy"), outdated: dias > 0 }
  }, [serieCompleta])

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Carregando dados…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-destructive/20 border-destructive">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-destructive-foreground">Erro ao carregar dados: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!serieCompleta.length) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-4">
      <Card className="bg-card border-border flex-1">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground flex items-center justify-between">
            <span>Monitoramento de Turbidez</span>
            {lastInfo?.outdated && (
              <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">
                Última leitura: {lastInfo.dataFmt} ({lastInfo.dias} d)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PRESETS).map(([lbl, dias]) => (
              <Button
                key={lbl}
                size="sm"
                variant={presetDias === dias ? "default" : "outline"}
                onClick={() => handlePresetChange(dias)}
                className={
                  presetDias === dias
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border text-muted-foreground hover:bg-muted"
                }
              >
                {lbl}
              </Button>
            ))}
          </div>

          <ChartContainer
            config={{
              turbidez: { label: "Turbidez (NTU)", color: "hsl(var(--chart-3))" }, // Blue
              secchiVert: { label: "Secchi (m)", color: "hsl(var(--chart-4))" }, // Yellow/Orange
              chuva: { label: "Chuva (mm)", color: "hsl(var(--chart-2))" }, // Cyan/Teal (using Chart 2 for contrast or maybe 5)
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="diaFmt"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="turb"
                  stroke="hsl(var(--chart-3))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => Math.ceil(d * 1.1)]} 
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{
                    value: "Turbidez (NTU)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" },
                  }}
                />
                <YAxis
                  yAxisId="secchi"
                  orientation="right"
                  stroke="hsl(var(--chart-4))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => Math.ceil(d * 1.1)]}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{ value: "Secchi (m)", angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" } }}
                />

                {TURBIDEZ_BANDS.map((b) => (
                  <ReferenceArea key={b.y1} yAxisId="turb" y1={b.y1} y2={b.y2} fill={b.color} stroke="none" />
                ))}

                <Bar
                  dataKey="chuva"
                  yAxisId="turb"
                  fill="var(--color-chuva)"
                  stroke="var(--color-chuva)"
                  fillOpacity={0.2}
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="turb"
                  dataKey="turbidez"
                  stroke="var(--color-turbidez)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-turbidez)", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: "var(--color-turbidez)", stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="secchi"
                  dataKey="secchiVert"
                  stroke="var(--color-secchiVert)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-secchiVert)", strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: "var(--color-secchiVert)", stroke: "#fff", strokeWidth: 2 }}
                />

                <Tooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[hsl(var(--chart-3))]" />
              <span className="text-muted-foreground">Turbidez (NTU)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[hsl(var(--chart-4))]" />
              <span className="text-muted-foreground">Secchi (m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-transparent border-2 border-[hsl(var(--chart-2))]" />
              <span className="text-muted-foreground">Chuva (mm)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-lg">Faixas de Turbidez</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TURBIDEZ_BANDS.map((band, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div
                className="w-4 h-4 rounded border border-border"
                style={{ backgroundColor: band.color.replace("33", "80") }}
              />
              <div className="flex-1">
                <div className="text-foreground text-sm font-medium">{band.label}</div>
                <div className="text-muted-foreground text-xs">{band.range}</div>
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-muted-foreground text-xs">
              <p className="mb-1">• Valores baixos indicam água mais clara</p>
              <p>• Valores altos indicam presença de sedimentos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
