"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useFogo } from "@/context/FogoContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoFogo() {
  const { filteredFogoData, isLoading, error } = useFogo()

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="mes" 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar 
            dataKey="focos" 
            fill="var(--color-focos)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
