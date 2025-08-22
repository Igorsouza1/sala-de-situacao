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
import { ChartContainer } from "@/components/ui/chart-components"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomTooltip } from "./custom-tooltip"
import type { SeriePonto, PresetKey, PresetValue } from "@/types/chart-types"


const PRESETS: Record<PresetKey, PresetValue> = {
  "7 d": 7,
  "15 d": 15,
  "30 d": 30,
}

const COLORS = {
  turbidez: "#3b82f6",
  secchiVert: "#f59e0b",
  chuva: "#06b6d4",
  grid: "#374151",
} as const

const TURBIDEZ_BANDS = [
  // 🟢 0–3 NTU
  { y1: 0,  y2: 3,   color: "#10b98133", label: "Flutuação excelente", range: "0–3 NTU" },
  // 🟡 4–7 NTU
  { y1: 3,  y2: 7,   color: "#eab30833", label: "Boa – atenção",       range: "4–7 NTU" },
  // 🟠 8–15 NTU
  { y1: 7,  y2: 15,  color: "#f9731633", label: "Regular – informe",   range: "8–15 NTU" },
  // 🔴 >15 NTU
  { y1: 15, y2: 300, color: "#ef444433", label: "Experiência ruim",    range: ">15 NTU" },
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
      <Card className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))]">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Carregando dados…
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-red-400">Erro ao carregar dados: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!serieCompleta.length) {
    return (
      <Card className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))]">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-400">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-4">
      <Card className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))] backdrop-blur-sm flex-1">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center justify-between">
            <span>Monitoramento de Turbidez</span>
            {lastInfo?.outdated && (
              <Badge variant="outline" className="border-amber-500 text-amber-400 bg-amber-500/10">
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
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-600 text-black-300 hover:bg-gray-800 hover:text-white"
                }
              >
                {lbl}
              </Button>
            ))}
          </div>

          <ChartContainer
            config={{
              turbidez: { label: "Turbidez (NTU)", color: COLORS.turbidez },
              secchiVert: { label: "Secchi (m)", color: COLORS.secchiVert },
              chuva: { label: "Chuva (mm)", color: COLORS.chuva },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.3} />
                <XAxis
                  dataKey="diaFmt"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="turb"
                  stroke={COLORS.turbidez}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => Math.ceil(d * 1.1)]} 
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{
                    value: "Turbidez (NTU)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />
                <YAxis
                  yAxisId="secchi"
                  orientation="right"
                  stroke={COLORS.secchiVert}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => Math.ceil(d * 1.1)]}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{ value: "Secchi (m)", angle: 90, position: "insideRight", style: { textAnchor: "middle" } }}
                />

                {TURBIDEZ_BANDS.map((b) => (
                  <ReferenceArea key={b.y1} yAxisId="turb" y1={b.y1} y2={b.y2} fill={b.color} stroke="none" />
                ))}

                <Bar
                  dataKey="chuva"
                  yAxisId="turb"
                  fill="#06b6d420"
                  stroke={COLORS.chuva}
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                />
                <Line
                  yAxisId="turb"
                  dataKey="turbidez"
                  stroke={COLORS.turbidez}
                  strokeWidth={3}
                  dot={{ fill: COLORS.turbidez, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: COLORS.turbidez, stroke: "#fff", strokeWidth: 2 }}
                />
                <Line
                  yAxisId="secchi"
                  dataKey="secchiVert"
                  stroke={COLORS.secchiVert}
                  strokeWidth={3}
                  dot={{ fill: COLORS.secchiVert, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: COLORS.secchiVert, stroke: "#fff", strokeWidth: 2 }}
                />

                <Tooltip content={<CustomTooltip />} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ backgroundColor: COLORS.turbidez }} />
              <span className="text-gray-300">Turbidez (NTU)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ backgroundColor: COLORS.secchiVert }} />
              <span className="text-gray-300">Secchi (m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-transparent" style={{ border: `2px solid ${COLORS.chuva}` }} />
              <span className="text-gray-300">Chuva (mm)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))] backdrop-blur-sm w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Faixas de Turbidez</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TURBIDEZ_BANDS.map((band, index) => (
            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div
                className="w-4 h-4 rounded border border-gray-600"
                style={{ backgroundColor: band.color.replace("33", "80") }}
              />
              <div className="flex-1">
                <div className="text-white text-sm font-medium">{band.label}</div>
                <div className="text-gray-400 text-xs">{band.range}</div>
              </div>
            </div>
          ))}

          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs">
              <p className="mb-1">• Valores baixos indicam água mais clara</p>
              <p>• Valores altos indicam presença de sedimentos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
