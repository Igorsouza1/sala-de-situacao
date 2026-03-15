"use client"

import { useState, useMemo, useCallback, type JSX } from "react"
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
import { ptBR } from "date-fns/locale"
import { useDailyDeque } from "@/context/DailyDequeContext"
import { useDailyPonteCure } from "@/context/DailyPonteCureContext"
import { useDailyBalneario } from "@/context/DailyBalnearioContext"
import { ChartContainer } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Info } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type PontoKey = "deque" | "ponte" | "balneario"

interface DequePoint {
  diaFmt: string
  originalDate: string
  chuva: number
  turbidez: number
  secchiVert: number
  secchiHoriz: number
}

interface PontePoint {
  diaFmt: string
  originalDate: string
  chuva: number
  nivel: number
  visibilidade: string
}

interface BalnearioPoint {
  diaFmt: string
  originalDate: string
  pluviometria: number
  turbidez: number
  secchiVert: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PONTOS: Record<PontoKey, { label: string; desc: string }> = {
  deque:     { label: "Deque de Pedras",    desc: "Turbidez · Secchi · Chuva" },
  ponte:     { label: "Ponte do Cure",      desc: "Nível do Rio · Chuva" },
  balneario: { label: "Balneário Municipal",desc: "Turbidez · Secchi · Chuva" },
}

const PRESETS: Record<string, number> = {
  "7 d":  7,
  "15 d": 15,
  "30 d": 30,
  "3 m":  90,
  "6 m":  180,
}

const TURBIDEZ_BANDS = [
  { y1: 0,   y2: 3,   fill: "#10b98122", border: "#10b981", label: "Excelente",      range: "0–3 NTU"  },
  { y1: 3,   y2: 7,   fill: "#eab30822", border: "#eab308", label: "Boa — atenção",  range: "3–7 NTU"  },
  { y1: 7,   y2: 15,  fill: "#f9731622", border: "#f97316", label: "Regular",         range: "7–15 NTU" },
  { y1: 15,  y2: 500, fill: "#ef444422", border: "#ef4444", label: "Ruim — interdição",range: ">15 NTU" },
]

const AXIS_STYLE = {
  fontSize: 11,
  stroke: "hsl(var(--muted-foreground))",
  tickLine: false,
  axisLine: false,
}

const LABEL_STYLE = { fill: "hsl(var(--muted-foreground))", fontSize: 11 }

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function TooltipRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {color && <span className="w-2.5 h-2.5 rounded-full inline-block flex-none" style={{ background: color }} />}
        {label}
      </span>
      <span className="text-foreground text-xs font-medium tabular-nums">{value}</span>
    </div>
  )
}

function CustomTooltipDeque({ active, payload, label }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DequePoint
  const fmtV = (v: number) => Number.isFinite(v) && v > 0 ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-xl space-y-1 min-w-[160px]">
      <p className="text-xs font-semibold text-foreground mb-2">
        {format(parseISO(d.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>
      <TooltipRow label="Turbidez"     value={`${fmtV(d.turbidez)} NTU`}  color="hsl(var(--chart-3))" />
      <TooltipRow label="Secchi Vert." value={`${fmtV(d.secchiVert)} m`}   color="hsl(var(--chart-4))" />
      <TooltipRow label="Secchi Horiz."value={`${fmtV(d.secchiHoriz)} m`}  color="hsl(var(--chart-5))" />
      <div className="border-t border-border/50 my-1" />
      <TooltipRow label="Chuva"        value={`${fmtV(d.chuva)} mm`}       color="hsl(var(--chart-2))" />
    </div>
  )
}

function CustomTooltipPonte({ active, payload }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as PontePoint
  const fmtV = (v: number) => Number.isFinite(v) && v > 0 ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"
  const visMap: Record<string, { cor: string; texto: string }> = {
    cristalino:  { cor: "text-blue-400",   texto: "Cristalino" },
    turvo:       { cor: "text-orange-400", texto: "Turvo"      },
    "muito turvo": { cor: "text-red-400",  texto: "Muito Turvo" },
  }
  const vis = visMap[d.visibilidade?.toLowerCase()] ?? { cor: "text-muted-foreground", texto: d.visibilidade ?? "—" }
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-xl space-y-1 min-w-[160px]">
      <p className="text-xs font-semibold text-foreground mb-2">
        {format(parseISO(d.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>
      <TooltipRow label="Nível do Rio" value={`${fmtV(d.nivel)} m`} color="hsl(var(--chart-1))" />
      <TooltipRow label="Chuva"        value={`${fmtV(d.chuva)} mm`} color="hsl(var(--chart-2))" />
      {d.visibilidade && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground text-xs">Visibilidade</span>
          <span className={`text-xs font-medium ${vis.cor}`}>{vis.texto}</span>
        </div>
      )}
    </div>
  )
}

function CustomTooltipBalneario({ active, payload }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as BalnearioPoint
  const fmtV = (v: number) => Number.isFinite(v) && v > 0 ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2.5 shadow-xl space-y-1 min-w-[160px]">
      <p className="text-xs font-semibold text-foreground mb-2">
        {format(parseISO(d.originalDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>
      <TooltipRow label="Turbidez"     value={`${fmtV(d.turbidez)} NTU`}      color="hsl(var(--chart-3))" />
      <TooltipRow label="Secchi Vert." value={`${fmtV(d.secchiVert)} m`}       color="hsl(var(--chart-4))" />
      <div className="border-t border-border/50 my-1" />
      <TooltipRow label="Chuva"        value={`${fmtV(d.pluviometria)} mm`}    color="hsl(var(--chart-2))" />
    </div>
  )
}

// ─── Side Legend ─────────────────────────────────────────────────────────────

function LegendaTurbidez() {
  return (
    <Card className="bg-card border-border w-56 flex-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm text-foreground">Faixas de Turbidez</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {TURBIDEZ_BANDS.map((b) => (
          <div key={b.y1} className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-muted/50 transition-colors">
            <span
              className="w-3.5 h-3.5 rounded-sm flex-none border"
              style={{ background: b.fill.replace("22", "66"), borderColor: b.border }}
            />
            <div>
              <p className="text-xs font-medium text-foreground leading-none">{b.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{b.range}</p>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-border space-y-1">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-orange-400">Atenção:</span> pico de turbidez logo após chuva forte é natural. Turbidez alta sem chuva recente indica carreamento.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LegendaPonte() {
  return (
    <Card className="bg-card border-border w-56 flex-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm text-foreground">Leitura do Gráfico</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-0.5 rounded flex-none" style={{ background: "hsl(var(--chart-1))" }} />
          <p className="text-xs text-muted-foreground">Nível do Rio (m)</p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-3 rounded-sm flex-none opacity-40" style={{ background: "hsl(var(--chart-2))" }} />
          <p className="text-xs text-muted-foreground">Chuva (mm)</p>
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Acompanhe a subida do nível do rio após eventos de chuva e o tempo de retorno à normalidade.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function safeNum(v: any, dec = 2): number {
  const n = Number(v)
  return Number.isFinite(n) ? Number(n.toFixed(dec)) : 0
}

function sliceByDays<T extends { originalDate: string }>(data: T[], days: number): T[] {
  if (!days || data.length === 0) return data
  return data.slice(-Math.min(days, data.length))
}

// ─── Sub-charts ──────────────────────────────────────────────────────────────

function ChartDeque({ data }: { data: DequePoint[] }) {
  return (
    <ChartContainer
      config={{
        turbidez:   { label: "Turbidez (NTU)",    color: "hsl(var(--chart-3))" },
        secchiVert: { label: "Secchi Vert. (m)",  color: "hsl(var(--chart-4))" },
        secchiHoriz:{ label: "Secchi Horiz. (m)", color: "hsl(var(--chart-5))" },
        chuva:      { label: "Chuva (mm)",        color: "hsl(var(--chart-2))" },
      }}
      className="h-[380px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 56, left: 12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />

          <XAxis
            dataKey="diaFmt"
            {...AXIS_STYLE}
            interval="preserveStartEnd"
          />

          {/* Left: Turbidez NTU */}
          <YAxis
            yAxisId="turb"
            orientation="left"
            {...AXIS_STYLE}
            stroke="hsl(var(--chart-3))"
            domain={[0, (d: number) => Math.ceil(d * 1.15 || 20)]}
            tickFormatter={(v) => v.toFixed(0)}
            label={{ value: "Turbidez (NTU)", angle: -90, position: "insideLeft", offset: -2, style: LABEL_STYLE }}
          />

          {/* Right: Secchi m */}
          <YAxis
            yAxisId="secchi"
            orientation="right"
            {...AXIS_STYLE}
            stroke="hsl(var(--chart-4))"
            domain={[0, (d: number) => Math.ceil(d * 1.2 || 5)]}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: "Secchi (m)", angle: 90, position: "insideRight", offset: 8, style: LABEL_STYLE }}
          />

          {/* Turbidez reference bands */}
          {TURBIDEZ_BANDS.map((b) => (
            <ReferenceArea key={b.y1} yAxisId="turb" y1={b.y1} y2={b.y2} fill={b.fill} stroke="none" />
          ))}

          {/* Chuva bars (shares turb axis — visual correlation) */}
          <Bar
            dataKey="chuva"
            yAxisId="turb"
            fill="var(--color-chuva)"
            fillOpacity={0.18}
            stroke="var(--color-chuva)"
            strokeOpacity={0.4}
            barSize={5}
            radius={[2, 2, 0, 0]}
          />

          {/* Turbidez line */}
          <Line
            yAxisId="turb"
            dataKey="turbidez"
            stroke="var(--color-turbidez)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />

          {/* Secchi vertical */}
          <Line
            yAxisId="secchi"
            dataKey="secchiVert"
            stroke="var(--color-secchiVert)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />

          {/* Secchi horizontal — dashed */}
          <Line
            yAxisId="secchi"
            dataKey="secchiHoriz"
            stroke="var(--color-secchiHoriz)"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />

          <Tooltip
            content={<CustomTooltipDeque />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

function ChartPonte({ data }: { data: PontePoint[] }) {
  return (
    <ChartContainer
      config={{
        nivel: { label: "Nível do Rio (m)", color: "hsl(var(--chart-1))" },
        chuva: { label: "Chuva (mm)",       color: "hsl(var(--chart-2))" },
      }}
      className="h-[380px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 56, left: 12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />

          <XAxis dataKey="diaFmt" {...AXIS_STYLE} interval="preserveStartEnd" />

          {/* Left: Nível do Rio */}
          <YAxis
            yAxisId="nivel"
            orientation="left"
            {...AXIS_STYLE}
            stroke="hsl(var(--chart-1))"
            domain={[0, (d: number) => Math.ceil(d * 1.2 || 5)]}
            tickFormatter={(v) => v.toFixed(2)}
            label={{ value: "Nível (m)", angle: -90, position: "insideLeft", offset: -2, style: LABEL_STYLE }}
          />

          {/* Right: Chuva */}
          <YAxis
            yAxisId="chuva"
            orientation="right"
            {...AXIS_STYLE}
            stroke="hsl(var(--chart-2))"
            domain={[0, (d: number) => Math.ceil(d * 1.2 || 50)]}
            tickFormatter={(v) => v.toFixed(0)}
            label={{ value: "Chuva (mm)", angle: 90, position: "insideRight", offset: 8, style: LABEL_STYLE }}
          />

          {/* Chuva bars */}
          <Bar
            dataKey="chuva"
            yAxisId="chuva"
            fill="var(--color-chuva)"
            fillOpacity={0.25}
            stroke="var(--color-chuva)"
            strokeOpacity={0.5}
            barSize={5}
            radius={[2, 2, 0, 0]}
          />

          {/* Nível do Rio */}
          <Line
            yAxisId="nivel"
            dataKey="nivel"
            stroke="var(--color-nivel)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />

          <Tooltip
            content={<CustomTooltipPonte />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

function ChartBalneario({ data }: { data: BalnearioPoint[] }) {
  return (
    <ChartContainer
      config={{
        turbidez:    { label: "Turbidez (NTU)",   color: "hsl(var(--chart-3))" },
        secchiVert:  { label: "Secchi Vert. (m)", color: "hsl(var(--chart-4))" },
        pluviometria:{ label: "Chuva (mm)",        color: "hsl(var(--chart-2))" },
      }}
      className="h-[380px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 56, left: 12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} vertical={false} />

          <XAxis dataKey="diaFmt" {...AXIS_STYLE} interval="preserveStartEnd" />

          <YAxis
            yAxisId="turb"
            orientation="left"
            {...AXIS_STYLE}
            stroke="hsl(var(--chart-3))"
            domain={[0, (d: number) => Math.ceil(d * 1.15 || 20)]}
            tickFormatter={(v) => v.toFixed(0)}
            label={{ value: "Turbidez (NTU)", angle: -90, position: "insideLeft", offset: -2, style: LABEL_STYLE }}
          />

          <YAxis
            yAxisId="secchi"
            orientation="right"
            {...AXIS_STYLE}
            stroke="hsl(var(--chart-4))"
            domain={[0, (d: number) => Math.ceil(d * 1.2 || 5)]}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: "Secchi (m)", angle: 90, position: "insideRight", offset: 8, style: LABEL_STYLE }}
          />

          {TURBIDEZ_BANDS.map((b) => (
            <ReferenceArea key={b.y1} yAxisId="turb" y1={b.y1} y2={b.y2} fill={b.fill} stroke="none" />
          ))}

          <Bar
            dataKey="pluviometria"
            yAxisId="turb"
            fill="var(--color-pluviometria)"
            fillOpacity={0.18}
            stroke="var(--color-pluviometria)"
            strokeOpacity={0.4}
            barSize={5}
            radius={[2, 2, 0, 0]}
          />

          <Line
            yAxisId="turb"
            dataKey="turbidez"
            stroke="var(--color-turbidez)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />

          <Line
            yAxisId="secchi"
            dataKey="secchiVert"
            stroke="var(--color-secchiVert)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />

          <Tooltip
            content={<CustomTooltipBalneario />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// ─── Legend row below chart ───────────────────────────────────────────────────

function LegendaLinha({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="20" height="10" className="flex-none">
        <line
          x1="0" y1="5" x2="20" y2="5"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "4 2" : undefined}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function LegendaBarra({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-4 h-3 rounded-sm flex-none opacity-50 border" style={{ background: color, borderColor: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GraficoCombinado(): JSX.Element {
  const dequeCtx    = useDailyDeque()
  const ponteCtx    = useDailyPonteCure()
  const balnearioCtx = useDailyBalneario()

  const [ponto, setPonto]   = useState<PontoKey>("deque")
  const [preset, setPreset] = useState<number>(30)

  // ── Data transforms ────────────────────────────────────────────────────────

  const dequeAll = useMemo<DequePoint[]>(() => {
    return dequeCtx.raw
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((e) => ({
        diaFmt:      format(parseISO(e.data), "dd/MM"),
        originalDate: e.data,
        chuva:       safeNum(e.chuva, 1),
        turbidez:    safeNum(e.turbidez, 2),
        secchiVert:  safeNum(e.secchiVertical, 2),
        secchiHoriz: safeNum(e.secchiHorizontal, 2),
      }))
  }, [dequeCtx.raw])

  const ponteAll = useMemo<PontePoint[]>(() => {
    return ponteCtx.raw
      .slice()
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((e) => ({
        diaFmt:       format(parseISO(e.data), "dd/MM"),
        originalDate: e.data,
        chuva:        safeNum(e.chuva, 1),
        nivel:        safeNum(e.nivel, 2),
        visibilidade: e.visibilidade ?? "",
      }))
  }, [ponteCtx.raw])

  const balnearioAll = useMemo<BalnearioPoint[]>(() => {
    return balnearioCtx.raw
      .filter((e) => e.data)
      .slice()
      .sort((a, b) => a.data!.localeCompare(b.data!))
      .map((e) => ({
        diaFmt:       format(parseISO(e.data!), "dd/MM"),
        originalDate: e.data!,
        pluviometria: safeNum(e.pluviometria, 1),
        turbidez:     safeNum(e.turbidez, 2),
        secchiVert:   safeNum(e.secchiVertical, 2),
      }))
  }, [balnearioCtx.raw])

  // ── Sliced by preset ────────────────────────────────────────────────────────

  const dequeData    = useMemo(() => sliceByDays(dequeAll, preset),    [dequeAll, preset])
  const ponteData    = useMemo(() => sliceByDays(ponteAll, preset),    [ponteAll, preset])
  const balnearioData = useMemo(() => sliceByDays(balnearioAll, preset), [balnearioAll, preset])

  // ── Last data info for stale-data badge ─────────────────────────────────────

  const lastInfo = useMemo(() => {
    const allData = ponto === "deque" ? dequeAll : ponto === "ponte" ? ponteAll : balnearioAll
    if (!allData.length) return null
    const last = allData[allData.length - 1]
    const dias = differenceInCalendarDays(new Date(), parseISO(last.originalDate))
    if (dias === 0) return null
    return {
      dataFmt: format(parseISO(last.originalDate), "dd/MM/yyyy"),
      dias,
    }
  }, [ponto, dequeAll, ponteAll, balnearioAll])

  // ── Loading / error states ──────────────────────────────────────────────────

  const isLoading = dequeCtx.isLoading || ponteCtx.isLoading || balnearioCtx.isLoading
  const hasError  = dequeCtx.error && ponteCtx.error && balnearioCtx.error

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground gap-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Carregando dados…
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive gap-2">
        <AlertTriangle className="h-4 w-4" />
        Erro ao carregar dados dos pontos de monitoramento.
      </div>
    )
  }

  const activeData = ponto === "deque" ? dequeData : ponto === "ponte" ? ponteData : balnearioData
  const isEmpty = activeData.length === 0

  return (
    <div className="space-y-4">

      {/* Controls: ponto tabs + preset buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        {/* Ponto selector */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(PONTOS) as [PontoKey, { label: string; desc: string }][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setPonto(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                ponto === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {val.label}
              <span className={`ml-1 text-xs ${ponto === key ? "opacity-70" : "opacity-50"}`}>
                · {val.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Preset date range */}
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(PRESETS).map(([lbl, dias]) => (
            <Button
              key={lbl}
              size="sm"
              variant={preset === dias ? "default" : "outline"}
              onClick={() => setPreset(dias)}
              className={`text-xs h-7 px-2.5 ${
                preset === dias
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {lbl}
            </Button>
          ))}
        </div>
      </div>

      {/* Stale data badge */}
      {lastInfo && (
        <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10 w-fit text-xs">
          Última leitura: {lastInfo.dataFmt} ({lastInfo.dias} {lastInfo.dias === 1 ? "dia" : "dias"} atrás)
        </Badge>
      )}

      {/* Main layout: chart + side legend */}
      <div className="flex gap-4 items-start">

        {/* Chart */}
        <div className="flex-1 min-w-0">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-[380px] text-muted-foreground gap-2">
              <Info className="h-5 w-5" />
              <p className="text-sm">Nenhum dado disponível para o período selecionado</p>
            </div>
          ) : ponto === "deque" ? (
            <ChartDeque data={dequeData} />
          ) : ponto === "ponte" ? (
            <ChartPonte data={ponteData} />
          ) : (
            <ChartBalneario data={balnearioData} />
          )}

          {/* Bottom legend row */}
          {!isEmpty && (
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 justify-center">
              {ponto === "deque" && (
                <>
                  <LegendaLinha  color="hsl(var(--chart-3))"  label="Turbidez (NTU)"    />
                  <LegendaLinha  color="hsl(var(--chart-4))"  label="Secchi Vert. (m)"  />
                  <LegendaLinha  color="hsl(var(--chart-5))"  label="Secchi Horiz. (m)" dashed />
                  <LegendaBarra  color="hsl(var(--chart-2))"  label="Chuva (mm)"         />
                </>
              )}
              {ponto === "ponte" && (
                <>
                  <LegendaLinha  color="hsl(var(--chart-1))"  label="Nível do Rio (m)"  />
                  <LegendaBarra  color="hsl(var(--chart-2))"  label="Chuva (mm)"         />
                </>
              )}
              {ponto === "balneario" && (
                <>
                  <LegendaLinha  color="hsl(var(--chart-3))"  label="Turbidez (NTU)"    />
                  <LegendaLinha  color="hsl(var(--chart-4))"  label="Secchi Vert. (m)"  />
                  <LegendaBarra  color="hsl(var(--chart-2))"  label="Chuva (mm)"         />
                </>
              )}
            </div>
          )}
        </div>

        {/* Side legend */}
        {ponto !== "ponte" ? <LegendaTurbidez /> : <LegendaPonte />}

      </div>
    </div>
  )
}
