"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
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
          color: "hsl(0, 70%, 60%)", // Vermelho mais vibrante
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis 
            dataKey="mes" 
            stroke="rgba(255,255,255,0.8)" 
            fontSize={12}
            tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.3)" }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.8)" 
            fontSize={12}
            tickLine={{ stroke: "rgba(255,255,255,0.3)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.3)" }}
          />
          <Tooltip 
            content={<ChartTooltipContent />}
            contentStyle={{
              backgroundColor: "hsl(var(--dashboard-card))",
              border: "1px solid hsl(var(--dashboard-accent))",
              borderRadius: "8px",
              color: "hsl(var(--dashboard-text))"
            }}
          />
          <Bar 
            dataKey="focos" 
            fill="hsl(0, 70%, 60%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

