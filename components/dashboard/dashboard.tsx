"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraficoFogo } from "./charts/grafico-fogo"
import { GraficoDesmatamento } from "./charts/grafico-desmatamento"
import { GraficoAcoes } from "./charts/grafico-acoes"
import { GraficoPontos } from "./charts/grafico-pontos"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AcoesProvider, useAcoes } from "@/context/AcoesContext"
import { FogoProvider, useFogo } from "@/context/FogoContext"
import { DesmatamentoProvider, useDesmatamento } from "@/context/DesmatamentoContext"
import { DequePedrasProvider, useDequePedras } from "@/context/DequePedrasContext"
import { PonteCureProvider, usePonteCure } from "@/context/PonteCureContext"
import {
  Globe,
  Zap,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
  BarChart3,
  MapPin,
  Droplets,
  Flame,
  TreePine,
  CheckCircle,
} from "lucide-react"

function DashboardContent() {
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos")
  const [viewMode, setViewMode] = useState<"macro" | "micro">("macro")
  const { setSelectedYear: setSelectedYearAcoes } = useAcoes()
  const { setSelectedYear: setSelectedYearFogo } = useFogo()
  const { setSelectedYear: setSelectedYearDesmatamento } = useDesmatamento()
  const { setSelectedYear: setSelectedYearDequePedras } = useDequePedras()
  const { setSelectedYear: setSelectedYearPonteCure } = usePonteCure()

  const handleAnoChange = (ano: string) => {
    setAnoSelecionado(ano)
    setSelectedYearAcoes(ano)
    setSelectedYearFogo(ano)
    setSelectedYearDesmatamento(ano)
    setSelectedYearDequePedras(ano)
    setSelectedYearPonteCure(ano)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl p-6 shadow-lg border border-slate-200">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#003C2C] rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard Ambiental</h1>
                <p className="text-slate-600">Monitoramento inteligente de dados geoespaciais</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sistema Ativo
            </Badge>
            <Select value={anoSelecionado} onValueChange={handleAnoChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os anos</SelectItem>
                <SelectItem value="2021">2021</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Analysis Mode Selector */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Análises Ambientais</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Visualizações macro e micro para diferentes níveis de análise
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "macro" | "micro")}
              className="w-full"
            >
              <div className="border-b border-slate-200 px-6 pt-6">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
                  <TabsTrigger value="macro" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <Globe className="h-4 w-4" />
                    Análise Macro
                  </TabsTrigger>
                  <TabsTrigger value="micro" className="flex items-center gap-2 data-[state=active]:bg-white">
                    <Zap className="h-4 w-4" />
                    Análise Micro
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="macro" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Visão Regional</h3>
                        <p className="text-sm text-slate-600">
                          Análise abrangente de indicadores ambientais por região e período
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Activity className="h-3 w-3 mr-1" />
                        Escala Regional
                      </Badge>
                    </div>

                    {/* Macro View - Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <Flame className="h-4 w-4 text-red-600" />
                            </div>
                            Focos de Incêndio
                          </CardTitle>
                          <p className="text-sm text-slate-600">Distribuição temporal de focos detectados</p>
                        </CardHeader>
                        <CardContent>
                          <GraficoFogo />
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <TreePine className="h-4 w-4 text-green-600" />
                            </div>
                            Desmatamento
                          </CardTitle>
                          <p className="text-sm text-slate-600">Área desmatada por período</p>
                        </CardHeader>
                        <CardContent>
                          <GraficoDesmatamento />
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-purple-600" />
                            </div>
                            Ações Realizadas
                          </CardTitle>
                          <p className="text-sm text-slate-600">Distribuição de ações por categoria</p>
                        </CardHeader>
                        <CardContent>
                          <GraficoAcoes />
                        </CardContent>
                      </Card>

                      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-blue-600" />
                            </div>
                            Pontos de Monitoramento
                          </CardTitle>
                          <p className="text-sm text-slate-600">Dados consolidados dos pontos de coleta</p>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="deque" className="space-y-4">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                              <TabsTrigger value="deque" className="data-[state=active]:bg-white">
                                Deque de Pedras
                              </TabsTrigger>
                              <TabsTrigger value="ponte" className="data-[state=active]:bg-white">
                                Ponte do Cure
                              </TabsTrigger>
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
                </TabsContent>

                <TabsContent value="micro" className="mt-0 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Análise Detalhada</h3>
                        <p className="text-sm text-slate-600">
                          Monitoramento específico de pontos críticos e variáveis ambientais
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                        <MapPin className="h-3 w-3 mr-1" />
                        Escala Local
                      </Badge>
                    </div>

                    {/* Micro View - Detailed Analysis */}
                    <div className="space-y-6">
                      {/* Detailed Point Analysis */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Droplets className="h-4 w-4 text-blue-600" />
                              </div>
                              Deque de Pedras - Análise Detalhada
                            </CardTitle>
                            <p className="text-sm text-slate-600">Monitoramento micro de qualidade da água</p>
                          </CardHeader>
                          <CardContent>
                            <GraficoPontos ponto="deque" ano={anoSelecionado} />
                          </CardContent>
                        </Card>

                        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                          <CardHeader className="pb-4">
                            <CardTitle className="text-slate-900 flex items-center gap-2">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Activity className="h-4 w-4 text-green-600" />
                              </div>
                              Ponte do Cure - Análise Detalhada
                            </CardTitle>
                            <p className="text-sm text-slate-600">Monitoramento micro de nível e visibilidade</p>
                          </CardHeader>
                          <CardContent>
                            <GraficoPontos ponto="ponte" ano={anoSelecionado} />
                          </CardContent>
                        </Card>
                      </div>

                      {/* Micro Analysis Summary */}
                      <Card className="border-0 shadow-md">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-slate-900 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-orange-600" />
                            Insights de Análise Micro
                          </CardTitle>
                          <p className="text-sm text-slate-600">Correlações e padrões identificados nos dados locais</p>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Droplets className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Qualidade da Água</span>
                              </div>
                              <p className="text-xs text-blue-700">
                                Variações de turbidez correlacionadas com períodos de chuva intensa
                              </p>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-900">Nível do Rio</span>
                              </div>
                              <p className="text-xs text-green-700">
                                Padrões sazonais consistentes com dados históricos de precipitação
                              </p>
                            </div>

                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-900">Tendências</span>
                              </div>
                              <p className="text-xs text-purple-700">
                                Melhoria gradual na qualidade da água nos últimos meses
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardAmbiental() {
  return (
    <AcoesProvider>
      <FogoProvider>
        <DesmatamentoProvider>
          <DequePedrasProvider>
            <PonteCureProvider>
              <DashboardContent />
            </PonteCureProvider>
          </DequePedrasProvider>
        </DesmatamentoProvider>
      </FogoProvider>
    </AcoesProvider>
  )
}
