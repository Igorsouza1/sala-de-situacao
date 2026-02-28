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
    return <p className="text-muted-foreground">Carregando...</p>
  }

  if (ponto === "ponte" && isLoadingPonte) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  if (ponto === "deque" && errorDeque) {
    return <p className="text-destructive">{errorDeque}</p>
  }

  if (ponto === "ponte" && errorPonte) {
    return <p className="text-destructive">{errorPonte}</p>
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
          <TabsTrigger value="chuva">Chuva</TabsTrigger>
          {ponto === "deque" ? (
            <TabsTrigger value="turbidez">Turbidez</TabsTrigger>
          ) : (
            <TabsTrigger value="visibilidade">Visibilidade</TabsTrigger>
          )}
          {ponto === "ponte" && (
            <TabsTrigger value="nivel">Nível do Rio</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chuva">
          <ChartContainer
            config={{
              chuva: {
                label: "Chuva (mm)",
                color: "hsl(var(--chart-3))", // Blue
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosChuva}>
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
                <Bar dataKey="chuva" fill="var(--color-chuva)" radius={[4, 4, 0, 0]} />
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
                  color: "hsl(var(--chart-1))", // Red
                },
                turbidezMin: {
                  label: "Turbidez Mínima",
                  color: "hsl(var(--chart-2))", // Green
                },
                turbidezMedia: {
                  label: "Turbidez Média",
                  color: "hsl(var(--chart-4))", // Yellow/Orange
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosTurbidez}>
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
                  <Area type="monotone" dataKey="turbidezMax" stroke="var(--color-turbidezMax)" fill="var(--color-turbidezMax)" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="turbidezMin" stroke="var(--color-turbidezMin)" fill="var(--color-turbidezMin)" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="turbidezMedia" stroke="var(--color-turbidezMedia)" fill="var(--color-turbidezMedia)" fillOpacity={0.3} />
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
                  color: "hsl(var(--chart-3))", // Blue
                },
                turvo: {
                  label: "Turvo",
                  color: "hsl(var(--chart-4))", // Yellow/Orange
                },
                muitoTurvo: {
                  label: "Muito Turvo",
                  color: "hsl(var(--chart-1))", // Red
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVisibilidade}>
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
                  <Bar dataKey="cristalino" stackId="a" fill="var(--color-cristalino)" />
                  <Bar dataKey="turvo" stackId="a" fill="var(--color-turvo)" />
                  <Bar dataKey="muitoTurvo" stackId="a" fill="var(--color-muitoTurvo)" />
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
                  color: "hsl(var(--chart-2))", // Green
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosNivel}>
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
                  <Area
                    type="monotone"
                    dataKey="nivel"
                    stroke="var(--color-nivel)"
                    fill="var(--color-nivel)"
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
