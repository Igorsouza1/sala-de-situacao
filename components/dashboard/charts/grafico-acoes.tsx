"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Pie, PieChart, ResponsiveContainer, Label } from "recharts"
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart-components"
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
  "hsl(var(--pantaneiro-green))",
  "hsl(var(--pantaneiro-lime))",
  "#3b82f6", // azul
  "#f59e0b", // amarelo
  "#8b5cf6", // roxo
  "#ef4444", // vermelho
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
    return <p className="text-[hsl(var(--dashboard-muted))]">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  if (processedData.length === 0) {
    return <p className="text-[hsl(var(--dashboard-muted))]">Nenhum dado encontrado</p>
  }

  const chartData = processedData.map((item, index) => ({
    acao: item.acao,
    valor: item.valor,
    fill: COLORS[index % COLORS.length],
  }))

  return (
    <div className="w-full">
      <ChartContainer config={chartConfig} className="w-full aspect-[4/3]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))] p-3 rounded-lg shadow-lg backdrop-blur-sm">
                      <p className="text-[hsl(var(--dashboard-text))] font-semibold">{data.acao}</p>
                      <p className="text-[hsl(var(--dashboard-muted))]">{data.valor} ações</p>
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
              stroke="hsl(var(--dashboard-accent))"
            >
              <Label
                content={({ viewBox }) => {
                  const safeViewBox = viewBox as ViewBox
                  if (safeViewBox && typeof safeViewBox.cx === "number" && typeof safeViewBox.cy === "number") {
                    return (
                      <text x={safeViewBox.cx} y={safeViewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan
                          x={safeViewBox.cx}
                          y={safeViewBox.cy}
                          className="fill-[hsl(var(--dashboard-text))] text-3xl font-bold"
                        >
                          {totalAcoes.toLocaleString()}
                        </tspan>
                        <tspan
                          x={safeViewBox.cx}
                          y={safeViewBox.cy + 30}
                          className="fill-[hsl(var(--dashboard-muted))] text-lg"
                        >
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
      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <TrendingUp className="h-4 w-4 text-[hsl(var(--dashboard-muted))]" />
        <span className="text-[hsl(var(--dashboard-muted))]">
          Total de {totalAcoes} ações {selectedYear !== "todos" ? `em ${selectedYear}` : "realizadas"}
        </span>
      </div>
    </div>
  )
}
