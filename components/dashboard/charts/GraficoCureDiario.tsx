"use client"

import { ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useMemo, useState, useCallback, type JSX } from "react"
import { format, parseISO, differenceInCalendarDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDailyPonteCure } from "@/context/DailyPonteCureContext"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PRESETS: Record<string, number> = {
  "7 d": 7,
  "15 d": 15,
  "30 d": 30,
}

interface SerieDia {
  label: string
  data: Date
  chuva: number | null
  nivel: number | null
  visibilidade: "cristalino" | "turvo" | "muitoTurvo"
}

// Custom tooltip needs to access payload which has semantic colors now?
// Or we just use ChartTooltipContent? The original had custom logic for emojis.
// I'll adapt ChartTooltipContent or keep custom if it adds value.
// The original `CustomTooltip` had specific emojis and formatting. I'll reimplement it using proper Tailwind classes.

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload as SerieDia
  if (!data) return null

  const statusVisibilidade = {
    cristalino: { colorClass: "text-blue-400", emoji: "💎", texto: "Cristalino" },
    turvo: { colorClass: "text-orange-400", emoji: "🌊", texto: "Turvo" },
    muitoTurvo: { colorClass: "text-red-400", emoji: "🟤", texto: "Muito Turvo" },
  }

  const status = statusVisibilidade[data.visibilidade]

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
      <p className="text-foreground font-medium mb-2">{format(data.data, "dd 'de' MMMM", { locale: ptBR })}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">Chuva:</span>
          <span className="text-foreground font-medium">{data.chuva} mm</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">Nível:</span>
          <span className="text-foreground font-medium">{data.nivel} m</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">Visibilidade:</span>
           <span className={`${status.colorClass} font-medium flex items-center gap-1`}>
             {status.emoji} {status.texto}
           </span>
        </div>
      </div>
    </div>
  )
}

export function GraficoPonteCure(): JSX.Element {
  const { raw, isLoading, error } = useDailyPonteCure()
  const [presetDias, setPresetDias] = useState<number>(30)

  const handlePresetChange = useCallback((dias: number) => {
    setPresetDias(dias)
  }, [])

  const serieCompleta: SerieDia[] = useMemo(() => {
    if (!raw.length) return []

    const sorted = raw
      .slice()
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

    return sorted.map((item) => ({
      label: format(parseISO(item.data), "dd/MM", { locale: ptBR }),
      data: parseISO(item.data),
      chuva: item.chuva !== null ? Number(item.chuva) : null,
      nivel: item.nivel !== null ? Number(item.nivel) : null,
      visibilidade: (item.visibilidade ?? "cristalino")
        .toLowerCase()
        .replace(" ", "") as SerieDia["visibilidade"],
    }))
  }, [raw])

  const displayData = useMemo(() => {
    return serieCompleta.slice(-presetDias)
  }, [serieCompleta, presetDias])

  // Status atual baseado nos últimos 3 dias
  const currentStatus = useMemo(() => {
    if (!displayData.length) return null

    const ultimosDias = displayData.slice(-3)
    const cristalinoRecente = ultimosDias.filter((d) => d.visibilidade === "cristalino").length
    const turvoRecente = ultimosDias.filter((d) => d.visibilidade === "turvo").length
    const muitoTurvoRecente = ultimosDias.filter((d) => d.visibilidade === "muitoTurvo").length

    const ultimo = displayData[displayData.length - 1]
    const hoje = new Date()
    const diasAtras = differenceInCalendarDays(hoje, ultimo.data)

    let statusCor = "green"
    let statusTexto = "Boa"
    let emoji = "💎"

    if (muitoTurvoRecente >= 2) {
      statusCor = "red"
      statusTexto = "Ruim"
      emoji = "🟤"
    } else if (turvoRecente >= 2) {
      statusCor = "orange"
      statusTexto = "Regular"
      emoji = "🌊"
    }

    return {
      cor: statusCor,
      texto: statusTexto,
      emoji,
      nivel: ultimo.nivel,
      diasAtras,
      dataFmt: format(ultimo.data, "dd/MM/yyyy"),
      outdated: diasAtras > 0,
    }
  }, [displayData])

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
      <Card className="bg-destructive/10 border-destructive">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-destructive">Erro: {error}</p>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">🌊 Ponte do Cure - Últimos Dias</CardTitle>
            <div className="flex items-center gap-3">
              {currentStatus && (
                <>
                  <Badge
                    variant="outline"
                    className={`${
                      currentStatus.cor === "green"
                        ? "border-emerald-500 text-emerald-500 bg-emerald-500/10"
                        : currentStatus.cor === "orange"
                          ? "border-orange-500 text-orange-500 bg-orange-500/10"
                          : "border-red-500 text-red-500 bg-red-500/10"
                    }`}
                  >
                    {currentStatus.emoji} {currentStatus.texto} - {currentStatus.nivel}m
                  </Badge>
                  {currentStatus?.outdated && (
                    <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10">
                      Última leitura: {currentStatus.dataFmt} ({currentStatus.diasAtras} d)
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
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
              chuva: { label: "Chuva (mm)", color: "hsl(var(--chart-3))" },
              nivel: { label: "Nível (m)", color: "hsl(var(--chart-2))" },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />

                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  yAxisId="chuva"
                  stroke="hsl(var(--chart-3))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => (d ? Math.ceil(d * 1.1) : 1)]}
                  tickFormatter={(v) => `${v.toFixed(0)}`}
                  label={{
                    value: "Chuva (mm)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" },
                  }}
                />

                <YAxis
                  yAxisId="nivel"
                  orientation="right"
                  stroke="hsl(var(--chart-2))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => (d ? Math.ceil(d * 1.1) : 1)]}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{
                    value: "Nível (m)",
                    angle: 90,
                    position: "insideRight",
                    style: { textAnchor: "middle", fill: "hsl(var(--muted-foreground))" },
                  }}
                />

                <Bar
                  dataKey="chuva"
                  yAxisId="chuva"
                  fill="var(--color-chuva)"
                  stroke="var(--color-chuva)"
                  fillOpacity={0.2}
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                />

                <Line
                  yAxisId="nivel"
                  dataKey="nivel"
                  stroke="var(--color-nivel)"
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    // Logic to color dots based on visibility
                    let color = "hsl(var(--chart-3))" // default blue
                    if (payload.visibilidade === "turvo") color = "hsl(var(--chart-4))" // orange
                    if (payload.visibilidade === "muitoTurvo") color = "hsl(var(--chart-1))" // red

                    return <circle key={cx} cx={cx} cy={cy} r={6} fill={color} stroke="#fff" strokeWidth={3} />
                  }}
                  activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }}
                />

                <Tooltip content={<CustomTooltip />} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[hsl(var(--chart-2))]" />
              <span className="text-muted-foreground">Nível (m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-transparent border-2 border-[hsl(var(--chart-3))]" />
              <span className="text-muted-foreground">Chuva (mm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[hsl(var(--chart-3))]" />
              <span className="text-muted-foreground">Cristalino</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[hsl(var(--chart-4))]" />
              <span className="text-muted-foreground">Turvo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[hsl(var(--chart-1))]" />
              <span className="text-muted-foreground">Muito Turvo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground text-lg">Visibilidade da Água</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
            <div className="flex-1">
              <div className="text-blue-400 text-sm font-medium">💎 Cristalino</div>
              <div className="text-muted-foreground text-xs">Ótima visibilidade</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white"></div>
            <div className="flex-1">
              <div className="text-orange-400 text-sm font-medium">🌊 Turvo</div>
              <div className="text-muted-foreground text-xs">Visibilidade reduzida</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white"></div>
            <div className="flex-1">
              <div className="text-red-400 text-sm font-medium">🟤 Muito Turvo</div>
              <div className="text-muted-foreground text-xs">Baixa visibilidade</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-muted-foreground text-xs space-y-2">
              <div className="font-medium text-foreground">📊 Como interpretar:</div>
              <div>• Pontos coloridos na linha verde mostram a visibilidade de cada dia</div>
              <div>• Barras azuis mostram a quantidade de chuva</div>
              <div>• Linha verde mostra o nível da água</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
