"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { acao: "Crime Ambiental", valor: 80 },
  { acao: "Fazenda", valor: 98 },
  { acao: "Nascente", valor: 86 },
  { acao: "Passivo Ambiental", valor: 99 },
  { acao: "Pesca", valor: 85 },
  { acao: "Pesca - Crime Ambiental", valor: 65 },
  { acao: "Plantio", valor: 79 },
  { acao: "Ponto de Referência", valor: 91 },
  { acao: "Régua Fluvial", valor: 88 },
]

export function GraficoAcoes({ ano }: { ano: string }) {
  return (
    <ChartContainer
      config={{
        valor: {
          label: "Ações Realizadas",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[300px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="acao" stroke="rgba(255,255,255,0.7)" />
          <Radar dataKey="valor" fill="hsl(var(--chart-3))" fillOpacity={0.6} />
          <ChartTooltip content={<ChartTooltipContent />} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
