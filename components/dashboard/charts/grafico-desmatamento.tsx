"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useDesmatamento } from "@/context/DesmatamentoContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoDesmatamento() {
  const { filteredDesmatamentoData, isLoading, error, selectedYear } = useDesmatamento()

  if (isLoading) {
    return <p className="text-white/70">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  const data = meses.map((mes, index) => ({
    mes,
    desmatamento: filteredDesmatamentoData[index] || 0,
  }))

  return (
    <ChartContainer
      config={{
        desmatamento: {
          label: "Áreas Desmatadas (ha)",
          color: "hsl(var(--chart-2))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
          <YAxis stroke="rgba(255,255,255,0.7)" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="desmatamento" fill="hsl(var(--chart-2))" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

