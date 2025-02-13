"use client"

import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDequePedras } from "@/context/DequePedrasContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoPontos({ ponto, ano }: { ponto: "deque" | "ponte"; ano: string }) {
  const [tipoGrafico, setTipoGrafico] = useState("chuva")
  const { filteredDequePedrasData, isLoading, error } = useDequePedras()

  if (isLoading) {
    return <p className="text-white/70">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  const dadosChuva = meses.map((mes, index) => ({
    mes,
    chuva: filteredDequePedrasData[index]?.chuva || 0,
  }))

  const dadosTurbidez = meses.map((mes, index) => ({
    mes,
    turbidezMax: filteredDequePedrasData[index]?.turbidezMax || 0,
    turbidezMin: filteredDequePedrasData[index]?.turbidezMin || 0,
    turbidezMedia: filteredDequePedrasData[index]?.turbidezMedia || 0,
  }))

  return (
    <div>
      <Tabs value={tipoGrafico} onValueChange={setTipoGrafico}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chuva" className="data-[state=active]:bg-pantaneiro-lime">
            Chuva
          </TabsTrigger>
          <TabsTrigger value="turbidez" className="data-[state=active]:bg-pantaneiro-lime">
            Turbidez
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chuva">
          <ChartContainer
            config={{
              chuva: {
                label: "Chuva (mm)",
                color: "hsl(var(--pantaneiro-lime))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosChuva}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="chuva" fill="hsl(var(--pantaneiro-lime))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
        <TabsContent value="turbidez">
          <ChartContainer
            config={{
              turbidezMax: {
                label: "Turbidez Máxima",
                color: "hsl(var(--chart-1))",
              },
              turbidezMin: {
                label: "Turbidez Mínima",
                color: "hsl(var(--chart-2))",
              },
              turbidezMedia: {
                label: "Turbidez Média",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosTurbidez}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
                <YAxis stroke="rgba(255,255,255,0.7)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="turbidezMax"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="turbidezMin"
                  stroke="hsl(var(--chart-2))"
                  fill="hsl(var(--chart-2))"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="turbidezMedia"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  )
}

