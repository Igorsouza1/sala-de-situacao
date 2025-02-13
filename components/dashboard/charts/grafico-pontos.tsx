"use client"

import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDequePedras } from "@/context/DequePedrasContext"
import { usePonteCure } from "@/context/PonteCureContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoPontos({ ponto, ano }: { ponto: "deque" | "ponte"; ano: string }) {
  const [tipoGrafico, setTipoGrafico] = useState("chuva")
  const { filteredDequePedrasData, isLoading: isLoadingDeque, error: errorDeque } = useDequePedras()
  const { filteredPonteCureData, isLoading: isLoadingPonte, error: errorPonte } = usePonteCure()

  if (ponto === "deque" && isLoadingDeque) {
    return <p className="text-white/70">Carregando...</p>
  }

  if (ponto === "ponte" && isLoadingPonte) {
    return <p className="text-white/70">Carregando...</p>
  }

  if (ponto === "deque" && errorDeque) {
    return <p className="text-red-400">{errorDeque}</p>
  }

  if (ponto === "ponte" && errorPonte) {
    return <p className="text-red-400">{errorPonte}</p>
  }

  const dadosChuva = meses.map((mes, index) => ({
    mes,
    chuva: ponto === "deque" ? filteredDequePedrasData[index]?.chuva || 0 : filteredPonteCureData[index]?.chuva || 0,
  }))

  const dadosTurbidez = meses.map((mes, index) => ({
    mes,
    turbidezMax: filteredDequePedrasData[index]?.turbidezMax || 0,
    turbidezMin: filteredDequePedrasData[index]?.turbidezMin || 0,
    turbidezMedia: filteredDequePedrasData[index]?.turbidezMedia || 0,
  }))

  const dadosVisibilidade = meses.map((mes, index) => ({
    mes,
    cristalino: filteredPonteCureData[index]?.visibilidade.cristalino || 0,
    turvo: filteredPonteCureData[index]?.visibilidade.turvo || 0,
    muitoTurvo: filteredPonteCureData[index]?.visibilidade.muitoTurvo || 0,
  }))

  const dadosNivel = meses.map((mes, index) => ({
    mes,
    nivel: filteredPonteCureData[index]?.nivel[0] || 0,
  }))

  return (
    <div>
      <Tabs value={tipoGrafico} onValueChange={setTipoGrafico}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chuva" className="data-[state=active]:bg-pantaneiro-lime">
            Chuva
          </TabsTrigger>
          {ponto === "deque" ? (
            <TabsTrigger value="turbidez" className="data-[state=active]:bg-pantaneiro-lime">
              Turbidez
            </TabsTrigger>
          ) : (
            <TabsTrigger value="visibilidade" className="data-[state=active]:bg-pantaneiro-lime">
              Visibilidade
            </TabsTrigger>
          )}
          {ponto === "ponte" && (
            <TabsTrigger value="nivel" className="data-[state=active]:bg-pantaneiro-lime">
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
        {ponto === "deque" && (
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
        )}
        {ponto === "ponte" && (
          <TabsContent value="visibilidade">
            <ChartContainer
              config={{
                cristalino: {
                  label: "Cristalino",
                  color: "hsl(var(--chart-1))",
                },
                turvo: {
                  label: "Turvo",
                  color: "hsl(var(--chart-2))",
                },
                muitoTurvo: {
                  label: "Muito Turvo",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVisibilidade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="mes" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cristalino" stackId="a" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="turvo" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="muitoTurvo" stackId="a" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        )}
        {ponto === "ponte" && (
          <TabsContent value="nivel">
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
                <AreaChart data={dadosNivel}>
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

