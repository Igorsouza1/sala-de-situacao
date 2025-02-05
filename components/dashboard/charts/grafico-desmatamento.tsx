"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { mes: "Jan", desmatamento: 5 },
  { mes: "Fev", desmatamento: 8 },
  { mes: "Mar", desmatamento: 12 },
  { mes: "Abr", desmatamento: 15 },
  { mes: "Mai", desmatamento: 20 },
  { mes: "Jun", desmatamento: 25 },
  { mes: "Jul", desmatamento: 30 },
  { mes: "Ago", desmatamento: 35 },
  { mes: "Set", desmatamento: 28 },
  { mes: "Out", desmatamento: 22 },
  { mes: "Nov", desmatamento: 18 },
  { mes: "Dez", desmatamento: 10 },
]

export function GraficoDesmatamento({ ano }: { ano: string }) {
  return (
    <ChartContainer
      config={{
        desmatamento: {
          label: "Áreas Desmatadas",
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
