"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Label } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { useAcoes } from "@/context/AcoesContext"

interface ViewBox {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  paddingAngle?: number
  midAngle?: number
}

const COLORS = [
  "hsl(var(--pantaneiro-lime))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export function GraficoAcoes() {
  const { filteredAcoes, isLoading, error, selectedYear } = useAcoes()

  const processedData = React.useMemo(() => {
    const acoesCount = filteredAcoes.reduce(
      (acc, acao) => {
        if (acao.acao !== "Ponto de Referência") {
          acc[acao.acao] = (acc[acao.acao] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(acoesCount)
      .map(([acao, valor]) => ({ acao, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [filteredAcoes])

  const totalAcoes = React.useMemo(() => {
    return processedData.reduce((acc, curr) => acc + curr.valor, 0)
  }, [processedData])

  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      acoes: { label: "Ações" },
    }
    processedData.forEach((item, index) => {
      config[item.acao] = {
        label: item.acao,
        color: COLORS[index % COLORS.length],
      }
    })
    return config
  }, [processedData])

  if (isLoading) {
    return <p className="text-black/70">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  if (processedData.length === 0) {
    return <p className="text-black/70">Nenhum dado encontrado</p>
  }

  const chartData = processedData.map((item, index) => ({
    acao: item.acao,
    valor: item.valor,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <Card className="bg-white/10 border-white/20">
      <CardHeader>
        <CardTitle className="text-black">
          Ações Realizadas {selectedYear !== "todos" ? `em ${selectedYear}` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full aspect-[4/3]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-2 rounded-lg shadow-lg">
                        <p className="text-black font-semibold">{data.acao}</p>
                        <p className="text-black/70">{data.valor} ações</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Pie
                data={chartData}
                dataKey="valor"
                nameKey="acao"
                innerRadius="60%"
                outerRadius="80%"
                strokeWidth={2}
                stroke="rgba(255,255,255,0.2)"
                
              >
                <Label
                  content={({ viewBox }) => {
                    const safeViewBox = viewBox as ViewBox
                    if (safeViewBox && typeof safeViewBox.cx === "number" && typeof safeViewBox.cy === "number") {
                      return (
                        <text x={safeViewBox.cx} y={safeViewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={safeViewBox.cx} y={safeViewBox.cy} className="fill-black text-3xl font-bold">
                            {totalAcoes.toLocaleString()}
                          </tspan>
                          <tspan x={safeViewBox.cx} y={safeViewBox.cy + 30} className="fill-black/70 text-lg">
                            Ações
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-black/70">
          <TrendingUp className="h-4 w-4" />
          <span className="text-black/70">
            Total de {totalAcoes} ações {selectedYear !== "todos" ? `em ${selectedYear}` : "realizadas"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

