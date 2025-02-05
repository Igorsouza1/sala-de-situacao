"use client"

import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const dadosChuva = [
  { mes: "Jan", chuva: 100 },
  { mes: "Fev", chuva: 120 },
  { mes: "Mar", chuva: 150 },
  { mes: "Abr", chuva: 80 },
  { mes: "Mai", chuva: 60 },
  { mes: "Jun", chuva: 40 },
  { mes: "Jul", chuva: 30 },
  { mes: "Ago", chuva: 20 },
  { mes: "Set", chuva: 50 },
  { mes: "Out", chuva: 70 },
  { mes: "Nov", chuva: 90 },
  { mes: "Dez", chuva: 110 },
]

const dadosTurbidez = [
  { mes: "Jan", turbidez: 5 },
  { mes: "Fev", turbidez: 7 },
  { mes: "Mar", turbidez: 10 },
  { mes: "Abr", turbidez: 8 },
  { mes: "Mai", turbidez: 6 },
  { mes: "Jun", turbidez: 4 },
  { mes: "Jul", turbidez: 3 },
  { mes: "Ago", turbidez: 2 },
  { mes: "Set", turbidez: 5 },
  { mes: "Out", turbidez: 7 },
  { mes: "Nov", turbidez: 9 },
  { mes: "Dez", turbidez: 11 },
]

const dadosTurbidezCure = [
  { mes: "Jan", cristalino: 10, turvo: 15, muitoTurvo: 5 },
  { mes: "Fev", cristalino: 12, turvo: 18, muitoTurvo: 7 },
  { mes: "Mar", cristalino: 15, turvo: 20, muitoTurvo: 10 },
  { mes: "Abr", cristalino: 8, turvo: 12, muitoTurvo: 4 },
  { mes: "Mai", cristalino: 6, turvo: 10, muitoTurvo: 3 },
  { mes: "Jun", cristalino: 4, turvo: 8, muitoTurvo: 2 },
  { mes: "Jul", cristalino: 3, turvo: 6, muitoTurvo: 1 },
  { mes: "Ago", cristalino: 2, turvo: 5, muitoTurvo: 1 },
  { mes: "Set", cristalino: 5, turvo: 9, muitoTurvo: 3 },
  { mes: "Out", cristalino: 7, turvo: 11, muitoTurvo: 4 },
  { mes: "Nov", cristalino: 9, turvo: 14, muitoTurvo: 6 },
  { mes: "Dez", cristalino: 11, turvo: 16, muitoTurvo: 8 },
]

const dadosNivelRio = [
  { mes: "Jan", nivel: 2.5 },
  { mes: "Fev", nivel: 3.0 },
  { mes: "Mar", nivel: 3.5 },
  { mes: "Abr", nivel: 3.2 },
  { mes: "Mai", nivel: 2.8 },
  { mes: "Jun", nivel: 2.3 },
  { mes: "Jul", nivel: 2.0 },
  { mes: "Ago", nivel: 1.8 },
  { mes: "Set", nivel: 2.1 },
  { mes: "Out", nivel: 2.4 },
  { mes: "Nov", nivel: 2.7 },
  { mes: "Dez", nivel: 3.1 },
]

export function GraficoPontos({ ponto, ano }: { ponto: "deque" | "ponte"; ano: string }) {
  const [tipoGrafico, setTipoGrafico] = useState("chuva")

  // Aqui você pode filtrar os dados com base no ano selecionado
  // Por enquanto, estamos usando dados estáticos

  return (
    <div>
      <Tabs value={tipoGrafico} onValueChange={setTipoGrafico}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chuva" className="data-[state=active]:bg-pantaneiro-lime">
            Chuva
          </TabsTrigger>
          <TabsTrigger value="turbidez" className="data-[state=active]:bg-pantaneiro-lime">
            Turbidez
          </TabsTrigger>
          {ponto === "ponte" && (
            <TabsTrigger value="nivelRio" className="data-[state=active]:bg-pantaneiro-lime">
              Nível do Rio
            </TabsTrigger>
          )}
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
          {ponto === "deque" ? (
            <ChartContainer
              config={{
                turbidez: {
                  label: "Turbidez",
                  color: "hsl(var(--pantaneiro-lime))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTurbidez}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="turbidez" fill="hsl(var(--pantaneiro-lime))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <ChartContainer
              config={{
                cristalino: {
                  label: "Cristalino",
                  color: "hsl(var(--pantaneiro-lime))",
                },
                turvo: {
                  label: "Turvo",
                  color: "hsl(var(--pantaneiro-lime-hover))",
                },
                muitoTurvo: {
                  label: "Muito Turvo",
                  color: "hsl(var(--pantaneiro-green))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosTurbidezCure}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cristalino" stackId="a" fill="hsl(var(--pantaneiro-lime))" />
                  <Bar dataKey="turvo" stackId="a" fill="hsl(var(--pantaneiro-lime-hover))" />
                  <Bar dataKey="muitoTurvo" stackId="a" fill="hsl(var(--pantaneiro-green))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </TabsContent>
        {ponto === "ponte" && (
          <TabsContent value="nivelRio">
            <ChartContainer
              config={{
                nivel: {
                  label: "Nível do Rio (m)",
                  color: "hsl(var(--pantaneiro-lime))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosNivelRio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="nivel"
                    stroke="hsl(var(--pantaneiro-lime))"
                    fill="hsl(var(--pantaneiro-lime))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

