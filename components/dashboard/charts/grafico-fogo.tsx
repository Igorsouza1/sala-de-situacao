"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { mes: "Jan", focos: 10 },
  { mes: "Fev", focos: 20 },
  { mes: "Mar", focos: 15 },
  { mes: "Abr", focos: 25 },
  { mes: "Mai", focos: 30 },
  { mes: "Jun", focos: 40 },
  { mes: "Jul", focos: 50 },
  { mes: "Ago", focos: 60 },
  { mes: "Set", focos: 45 },
  { mes: "Out", focos: 35 },
  { mes: "Nov", focos: 25 },
  { mes: "Dez", focos: 15 },
]

export function GraficoFogo({ ano }: { ano: string }) {
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

