"use client"

import { ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useMemo, useState, useCallback, type JSX } from "react"
import { format, parseISO, differenceInCalendarDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useDailyPonteCure } from "@/context/DailyPonteCureContext"
import { ChartContainer } from "@/components/ui/chart-components"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PRESETS: Record<string, number> = {
  "7 d": 7,
  "15 d": 15,
  "30 d": 30,
}

const COLORS = {
  chuva: "#06b6d4",
  nivel: "#22c55e",
  grid: "#374151",
  cristalino: "#3b82f6",
  turvo: "#f97316",
  muitoTurvo: "#ef4444",
} as const

// Faixas de referência para nível da água
// Remover completamente NIVEL_BANDS

interface SerieDia {
  label: string
  data: Date
  chuva: number | null
  nivel: number | null
  visibilidade: "cristalino" | "turvo" | "muitoTurvo"
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload as SerieDia
  if (!data) return null

  const statusVisibilidade = {
    cristalino: { cor: "text-blue-400", emoji: "💎", texto: "Cristalino" },
    turvo: { cor: "text-orange-400", emoji: "🌊", texto: "Turvo" },
    muitoTurvo: { cor: "text-red-400", emoji: "🟤", texto: "Muito Turvo" },
  }

  const status = statusVisibilidade[data.visibilidade]

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-white font-medium mb-2">{format(data.data, "dd 'de' MMMM", { locale: ptBR })}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-300 text-sm">Chuva:</span>
          <span className="text-white font-medium">{data.chuva} mm</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-300 text-sm">Nível:</span>
          <span className="text-white font-medium">{data.nivel} m</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-300 text-sm">Visibilidade:</span>
          <span className={`font-medium ${status.cor}`}>
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
      <Card className="bg-gray-900/50 border-gray-700">
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
          <p className="text-red-400">Erro: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!serieCompleta.length) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-gray-400">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-4">
      <Card className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))] backdrop-blur-sm flex-1 w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Removido o título interno */}
            <div className="flex items-center gap-3 ml-auto">
              {currentStatus && (
                <>
                  <Badge
                    variant="outline"
                    className={`${
                      currentStatus.cor === "green"
                        ? "border-green-500 text-green-400 bg-green-500/10"
                        : currentStatus.cor === "orange"
                          ? "border-orange-500 text-orange-400 bg-orange-500/10"
                          : "border-red-500 text-red-400 bg-red-500/10"
                    }`}
                  >
                    {currentStatus.emoji} {currentStatus.texto} - {currentStatus.nivel}m
                  </Badge>
                  {currentStatus?.outdated && (
                    <Badge variant="outline" className="border-amber-500 text-amber-400 bg-amber-500/10">
                      Última leitura: {currentStatus.dataFmt} ({currentStatus.diasAtras} d)
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-nowrap w-full">
            {Object.entries(PRESETS).map(([lbl, dias]) => (
              <Button
                key={lbl}
                size="sm"
                variant="ghost"
                onClick={() => handlePresetChange(dias)}
                className={`
                  px-4 py-2 rounded-full font-medium transition-all duration-200
                  ${presetDias === dias
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-transparent text-blue-600 hover:bg-blue-50"}
                  border border-transparent
                  focus:outline-none focus:ring-2 focus:ring-blue-300
                `}
                aria-pressed={presetDias === dias}
              >
                {lbl}
              </Button>
            ))}
          </div>

          <ChartContainer
            config={{
              chuva: { label: "Chuva (mm)", color: COLORS.chuva },
              nivel: { label: "Nível (m)", color: COLORS.nivel },
            }}
            className="h-[400px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} opacity={0.3} />

                <XAxis
                  dataKey="label"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  yAxisId="chuva"
                  stroke={COLORS.chuva}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => (d ? Math.ceil(d * 1.1) : 1)]}
                  tickFormatter={(v) => `${v.toFixed(0)}`}
                  label={{
                    value: "Chuva (mm)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }}
                />

                <YAxis
                  yAxisId="nivel"
                  orientation="right"
                  stroke={COLORS.nivel}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, (d: number) => (d ? Math.ceil(d * 1.1) : 1)]}
                  tickFormatter={(v) => `${v.toFixed(1)}`}
                  label={{
                    value: "Nível (m)",
                    angle: 90,
                    position: "insideRight",
                    style: { textAnchor: "middle" },
                  }}
                />

                {/* Remover todas as ReferenceArea */}

                <Bar
                  dataKey="chuva"
                  yAxisId="chuva"
                  fill={COLORS.chuva + "30"}
                  stroke={COLORS.chuva}
                  barSize={6}
                  radius={[2, 2, 0, 0]}
                />

                <Line
                  yAxisId="nivel"
                  dataKey="nivel"
                  stroke={COLORS.nivel}
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props
                    const cor = COLORS[payload.visibilidade as keyof typeof COLORS]
                    return <circle key={cx} cx={cx} cy={cy} r={6} fill={cor} stroke="#fff" strokeWidth={3} />
                  }}
                  activeDot={{ r: 8, stroke: "#fff", strokeWidth: 3 }}
                />

                <Tooltip content={<CustomTooltip />} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5" style={{ backgroundColor: COLORS.nivel }} />
              <span className="text-gray-300">Nível (m)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-transparent" style={{ border: `2px solid ${COLORS.chuva}` }} />
              <span className="text-gray-300">Chuva (mm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.cristalino }} />
              <span className="text-gray-300">Cristalino</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.turvo }} />
              <span className="text-gray-300">Turvo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.muitoTurvo }} />
              <span className="text-gray-300">Muito Turvo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))] backdrop-blur-sm w-64">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Visibilidade da Água</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
            <div className="flex-1">
              <div className="text-blue-400 text-sm font-medium">💎 Cristalino</div>
              <div className="text-gray-400 text-xs">Ótima visibilidade</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white"></div>
            <div className="flex-1">
              <div className="text-orange-400 text-sm font-medium">🌊 Turvo</div>
              <div className="text-gray-400 text-xs">Visibilidade reduzida</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white"></div>
            <div className="flex-1">
              <div className="text-red-400 text-sm font-medium">🟤 Muito Turvo</div>
              <div className="text-gray-400 text-xs">Baixa visibilidade</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-gray-400 text-xs space-y-2">
              <div className="font-medium text-white">📊 Como interpretar:</div>
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
