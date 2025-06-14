"use client"

import { ComposedChart, Line, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useMemo, useState, useCallback, type JSX } from "react"
import { format, subDays, differenceInCalendarDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { usePonteCure } from "@/context/PonteCureContext"
import { ChartContainer } from "@/components/ui/chart"
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
  chuva: number
  nivel: number
  visibilidade: "cristalino" | "turvo" | "muitoTurvo"
  probabilidadeCristalino: number
  probabilidadeTurvo: number
  probabilidadeMuitoTurvo: number
}

// Função para gerar dados diários simulados baseados nos dados mensais
function gerarDadosDiarios(dadosMensais: any[], ano: number, diasParaGerar: number): SerieDia[] {
  const dadosDiarios: SerieDia[] = []

  // Se não há dados, usar ano atual como fallback
  const anoBase = ano || new Date().getFullYear()

  // Começar do final do ano e voltar os dias solicitados
  const ultimoDiaDoAno = new Date(anoBase, 11, 31) // 31 de dezembro do ano

  for (let i = diasParaGerar - 1; i >= 0; i--) {
    const dataAtual = subDays(ultimoDiaDoAno, i)
    const mesAtual = dataAtual.getMonth()

    // Pega os dados do mês correspondente (ou usa dados padrão se não existir)
    const dadosDoMes = dadosMensais[mesAtual] || {
      chuva: Math.random() * 20,
      nivel: [0.8 + Math.random() * 1.5],
      visibilidade: { cristalino: 15, turvo: 10, muitoTurvo: 5 },
    }

    // Simula variação diária baseada nos dados mensais
    const variacao = (Math.random() - 0.5) * 0.3 // ±15% de variação
    const chuvaBase = dadosDoMes.chuva / 30 // Distribui chuva mensal pelos dias
    const chuvaDiaria = Math.max(0, chuvaBase + (Math.random() * 10 - 5)) // Adiciona aleatoriedade

    // Calcula nível com base na chuva e variação natural
    const nivelBase =
      dadosDoMes.nivel.length > 0
        ? dadosDoMes.nivel.reduce((s: number, n: number) => s + n, 0) / dadosDoMes.nivel.length
        : 1.2
    const nivel = Math.max(0.1, nivelBase + variacao + (chuvaDiaria > 5 ? 0.1 : 0))

    // Determina visibilidade baseada no nível e chuva recente
    const totalVis =
      dadosDoMes.visibilidade.cristalino + dadosDoMes.visibilidade.turvo + dadosDoMes.visibilidade.muitoTurvo
    const probCristalino = totalVis > 0 ? dadosDoMes.visibilidade.cristalino / totalVis : 0.5
    const probTurvo = totalVis > 0 ? dadosDoMes.visibilidade.turvo / totalVis : 0.3
    const probMuitoTurvo = totalVis > 0 ? dadosDoMes.visibilidade.muitoTurvo / totalVis : 0.2

    // Ajusta probabilidades baseado na chuva recente
    let visibilidade: SerieDia["visibilidade"] = "cristalino"
    const fatorChuva = chuvaDiaria > 10 ? 0.3 : chuvaDiaria > 5 ? 0.1 : 0
    const rand = Math.random() + fatorChuva

    if (rand > probCristalino + probTurvo) {
      visibilidade = "muitoTurvo"
    } else if (rand > probCristalino) {
      visibilidade = "turvo"
    }

    dadosDiarios.push({
      label: format(dataAtual, "dd/MM", { locale: ptBR }),
      data: dataAtual,
      chuva: Number(chuvaDiaria.toFixed(1)),
      nivel: Number(nivel.toFixed(2)),
      visibilidade,
      probabilidadeCristalino: probCristalino * 100,
      probabilidadeTurvo: probTurvo * 100,
      probabilidadeMuitoTurvo: probMuitoTurvo * 100,
    })
  }

  return dadosDiarios
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
  const { filteredPonteCureData, isLoading, error, selectedYear } = usePonteCure()
  const [presetDias, setPresetDias] = useState<number>(30)

  const handlePresetChange = useCallback((dias: number) => {
    setPresetDias(dias)
  }, [])

  const serieCompleta: SerieDia[] = useMemo(() => {
    // Determinar o ano baseado no selectedYear do contexto
    let anoParaUsar = new Date().getFullYear()

    if (selectedYear && selectedYear !== "todos") {
      anoParaUsar = Number.parseInt(selectedYear)
    } else if (filteredPonteCureData.length > 0) {
      // Se tem dados, usar 2024 como padrão (ano dos dados reais)
      anoParaUsar = 2024
    }

    if (!filteredPonteCureData.length) {
      // Se não há dados, gera dados simulados para o ano correto
      const dadosSimulados = Array(12)
        .fill(null)
        .map((_, idx) => ({
          chuva: 20 + Math.random() * 40,
          nivel: [1.0 + Math.random() * 1.5, 1.2 + Math.random() * 1.3],
          visibilidade: {
            cristalino: 15 + Math.random() * 10,
            turvo: 8 + Math.random() * 7,
            muitoTurvo: 2 + Math.random() * 5,
          },
        }))
      return gerarDadosDiarios(dadosSimulados, anoParaUsar, 30)
    }

    return gerarDadosDiarios(filteredPonteCureData, anoParaUsar, 30)
  }, [filteredPonteCureData, selectedYear])

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
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm flex-1">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">🌊 Ponte do Cure - Últimos Dias</CardTitle>
            <div className="flex items-center gap-3">
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
                    : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                }
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
            className="h-[400px]"
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
                  domain={[0, (d: number) => Math.ceil(d * 1.1)]}
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
                  domain={[0, (d: number) => Math.ceil(d * 1.1)]}
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
                    return <circle cx={cx} cy={cy} r={6} fill={cor} stroke="#fff" strokeWidth={3} />
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

      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm w-64">
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
