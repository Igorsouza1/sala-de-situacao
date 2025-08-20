"use client"

import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart-components"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDequePedras } from "@/context/DequePedrasContext"
import { usePonteCure } from "@/context/PonteCureContext"

const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function GraficoPontos({ ponto, ano }: { ponto: "deque" | "ponte"; ano: string }) {
  const [tipoGrafico, setTipoGrafico] = useState("chuva")
  const { filteredDequePedrasData, isLoading: isLoadingDeque, error: errorDeque } = useDequePedras()
  const { filteredPonteCureData, isLoading: isLoadingPonte, error: errorPonte } = usePonteCure()

  if (ponto === "deque" && isLoadingDeque) {
    return <p className="text-[hsl(var(--dashboard-muted))]">Carregando...</p>
  }

  if (ponto === "ponte" && isLoadingPonte) {
    return <p className="text-[hsl(var(--dashboard-muted))]">Carregando...</p>
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
        <TabsList className="grid w-full grid-cols-3 bg-[hsl(var(--dashboard-accent))]">
          <TabsTrigger
            value="chuva"
            className="data-[state=active]:bg-pantaneiro-green data-[state=active]:text-white text-[hsl(var(--dashboard-muted))]"
          >
            Chuva
          </TabsTrigger>
          {ponto === "deque" ? (
            <TabsTrigger
              value="turbidez"
              className="data-[state=active]:bg-pantaneiro-green data-[state=active]:text-white text-[hsl(var(--dashboard-muted))]"
            >
              Turbidez
            </TabsTrigger>
          ) : (
            <TabsTrigger
              value="visibilidade"
              className="data-[state=active]:bg-pantaneiro-green data-[state=active]:text-white text-[hsl(var(--dashboard-muted))]"
            >
              Visibilidade
            </TabsTrigger>
          )}
          {ponto === "ponte" && (
            <TabsTrigger
              value="nivel"
              className="data-[state=active]:bg-pantaneiro-green data-[state=active]:text-white text-[hsl(var(--dashboard-muted))]"
            >
              Nível do Rio
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chuva">
          <ChartContainer
            config={{
              chuva: {
                label: "Chuva (mm)",
                color: "#3b82f6",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosChuva}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--dashboard-accent))" />
                <XAxis dataKey="mes" stroke="hsl(var(--dashboard-muted))" />
                <YAxis stroke="hsl(var(--dashboard-muted))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="chuva" fill="#3b82f6" />
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
                  color: "#ef4444",
                },
                turbidezMin: {
                  label: "Turbidez Mínima",
                  color: "hsl(var(--pantaneiro-lime))",
                },
                turbidezMedia: {
                  label: "Turbidez Média",
                  color: "#f59e0b",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosTurbidez}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--dashboard-accent))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--dashboard-muted))" />
                  <YAxis stroke="hsl(var(--dashboard-muted))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="turbidezMax" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                  <Area
                    type="monotone"
                    dataKey="turbidezMin"
                    stroke="hsl(var(--pantaneiro-lime))"
                    fill="hsl(var(--pantaneiro-lime))"
                    fillOpacity={0.3}
                  />
                  <Area type="monotone" dataKey="turbidezMedia" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
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
                  color: "#3b82f6",
                },
                turvo: {
                  label: "Turvo",
                  color: "#f59e0b",
                },
                muitoTurvo: {
                  label: "Muito Turvo",
                  color: "#ef4444",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVisibilidade}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--dashboard-accent))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--dashboard-muted))" />
                  <YAxis stroke="hsl(var(--dashboard-muted))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cristalino" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="turvo" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="muitoTurvo" stackId="a" fill="#ef4444" />
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
                  color: "hsl(var(--pantaneiro-green))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosNivel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--dashboard-accent))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--dashboard-muted))" />
                  <YAxis stroke="hsl(var(--dashboard-muted))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="nivel"
                    stroke="hsl(var(--pantaneiro-green))"
                    fill="hsl(var(--pantaneiro-green))"
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
