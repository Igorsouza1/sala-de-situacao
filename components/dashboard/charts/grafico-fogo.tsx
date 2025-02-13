"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useFogo } from "@/context/FogoContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoFogo() {
  const { filteredFogoData, isLoading, error, selectedYear } = useFogo()

  if (isLoading) {
    return <p className="text-white/70">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  const data = meses.map((mes, index) => ({
    mes,
    focos: filteredFogoData[index] || 0,
  }))

  return (
    <ChartContainer
      config={{
        focos: {
          label: "Focos de Incêndio",
          color: "hsl(var(--chart-1))",
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
          <Bar dataKey="focos" fill="hsl(var(--chart-1))" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

