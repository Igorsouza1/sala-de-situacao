"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useDesmatamento } from "@/context/DesmatamentoContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoDesmatamento() {
  const { filteredDesmatamentoData, isLoading, error } = useDesmatamento()

  if (isLoading) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
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
            dataKey="desmatamento" 
            fill="var(--color-desmatamento)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
