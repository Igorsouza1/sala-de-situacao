"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraficoFogo } from './charts/grafico-fogo'
import { GraficoDesmatamento } from './charts/grafico-desmatamento'
import { GraficoAcoes } from './charts/grafico-acoes'
import { GraficoPontos } from './charts/grafico-pontos'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardAmbiental() {
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos")

  return (
    <div className="max-h-screen w-full bg-pantaneiro-green p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center sticky top-0 bg-pantaneiro-green z-10 py-4">
          <h1 className="text-3xl font-bold text-white">Dashboard Ambiental</h1>
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os anos</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Focos de Incêndio</CardTitle>
            </CardHeader>
            <CardContent>
              <GraficoFogo ano={anoSelecionado} />
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Desmatamento</CardTitle>
            </CardHeader>
            <CardContent>
              <GraficoDesmatamento ano={anoSelecionado} />
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Ações Realizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <GraficoAcoes />
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Pontos de Monitoramento</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deque" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deque" className="data-[state=active]:bg-pantaneiro-lime">Deque de Pedras</TabsTrigger>
                  <TabsTrigger value="ponte" className="data-[state=active]:bg-pantaneiro-lime">Ponte do Cure</TabsTrigger>
                </TabsList>
                <TabsContent value="deque">
                  <GraficoPontos ponto="deque" ano={anoSelecionado} />
                </TabsContent>
                <TabsContent value="ponte">
                  <GraficoPontos ponto="ponte" ano={anoSelecionado} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
