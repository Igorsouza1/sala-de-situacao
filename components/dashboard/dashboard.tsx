"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  BarChart3,
  MapPin,
  Droplets,
  Flame,
  TreePine,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  CloudRain,
  Waves,
  Gauge,
} from "lucide-react"
import { GraficoTurbidezComparativo } from "./charts/GraficoTurbidezComparativo"
import { DailyDequeProvider } from "@/context/DailyDequeContext"
import { GraficoPonteCure } from "./charts/GraficoCureDiario"
import { DailyPonteCureProvider } from "@/context/DailyPonteCureContext"

// Mock data for indicators - replace with real data
const indicadores = {
  nivelRioComparativo: {
    atual: 2.45,
    anoPassado: 2.12,
    tendencia: "alta", // alta, baixa, estavel
    percentual: 15.6,
  },
  chuvaComparativa: {
    atual: 145.2,
    anoPassado: 132.8,
    tendencia: "alta",
    percentual: 9.3,
  },
  tendenciaNivelRio7Dias: {
    tendencia: "baixa",
    variacao: -0.23,
    status: "normal",
  },
  tendenciaTurbidez7Dias: {
    tendencia: "estavel",
    variacao: 0.05,
    status: "bom",
  },
}

function IndicatorCard({
  title,
  icon: Icon,
  value,
  comparison,
  trend,
  unit = "",
  colorScheme = "blue",
}: {
  title: string
  icon: any
  value: string | number
  comparison?: string
  trend: "alta" | "baixa" | "estavel"
  unit?: string
  colorScheme?: "blue" | "green" | "orange" | "purple"
}) {
  const colorClasses = {
    blue: "bg-blue-500/20 border-blue-500/30 text-blue-400",
    green: "bg-pantaneiro-lime/20 border-pantaneiro-lime/30 text-pantaneiro-lime",
    orange: "bg-orange-500/20 border-orange-500/30 text-orange-400",
    purple: "bg-purple-500/20 border-purple-500/30 text-purple-400",
  }

  const getTrendIcon = () => {
    switch (trend) {
      case "alta":
        return <ArrowUp className="h-4 w-4 text-green-400" />
      case "baixa":
        return <ArrowDown className="h-4 w-4 text-red-400" />
      case "estavel":
        return <Minus className="h-4 w-4 text-yellow-400" />
    }
  }

  return (
    <Card className="shadow-md bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[colorScheme]}`}>
            <Icon className="h-5 w-5" />
          </div>
          {getTrendIcon()}
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[hsl(var(--dashboard-muted))]">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[hsl(var(--dashboard-text))]">
              {value}
              {unit}
            </span>
          </div>
          {comparison && <p className="text-xs text-[hsl(var(--dashboard-muted))]">{comparison}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

function DashboardContent() {
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos")
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
    <div className="min-h-screen w-full bg-gradient-to-br from-[hsl(var(--dashboard-bg))] to-[hsl(var(--dashboard-accent))]">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[hsl(var(--dashboard-card))] rounded-xl p-6 shadow-lg border border-[hsl(var(--dashboard-accent))]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pantaneiro-green rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[hsl(var(--dashboard-text))]">Dashboard Ambiental</h1>
                <p className="text-[hsl(var(--dashboard-muted))]">Monitoramento inteligente de dados geoespaciais</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-pantaneiro-lime text-pantaneiro-lime bg-pantaneiro-lime/10">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sistema Ativo
            </Badge>  
            <Button
              variant="outline"
              size="sm"
              className="border-[hsl(var(--dashboard-accent))] text-[hsl(var(--dashboard-text))] hover:bg-[hsl(var(--dashboard-accent))] text-black hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* 1. Indicadores Baseados em Dados Históricos/Atuais */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-pantaneiro-green rounded-lg flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[hsl(var(--dashboard-text))]">Indicadores Principais</h2>
              <p className="text-sm text-[hsl(var(--dashboard-muted))]">
                Comparativos e tendências baseados em dados históricos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <IndicatorCard
              title="Nível do Rio vs Ano Passado"
              icon={Waves}
              value={indicadores.nivelRioComparativo.atual}
              comparison={`${indicadores.nivelRioComparativo.percentual > 0 ? "+" : ""}${indicadores.nivelRioComparativo.percentual}% vs ano passado`}
              trend={indicadores.nivelRioComparativo.tendencia as "alta" | "baixa" | "estavel"}
              unit="m"
              colorScheme="blue"
            />

            <IndicatorCard
              title="Chuva vs Ano Passado"
              icon={CloudRain}
              value={indicadores.chuvaComparativa.atual}
              comparison={`${indicadores.chuvaComparativa.percentual > 0 ? "+" : ""}${indicadores.chuvaComparativa.percentual}% vs ano passado`}
              trend={indicadores.chuvaComparativa.tendencia as "alta" | "baixa" | "estavel"}
              unit="mm"
              colorScheme="green"
            />

            <IndicatorCard
              title="Tendência Nível Rio (7 dias)"
              icon={TrendingUp}
              value={indicadores.tendenciaNivelRio7Dias.variacao}
              comparison="Variação nos últimos 7 dias"
              trend={indicadores.tendenciaNivelRio7Dias.tendencia as "baixa" | "alta" | "estavel"}
              unit="m"
              colorScheme="orange"
            />

            <IndicatorCard
              title="Tendência Turbidez (7 dias)"
              icon={Gauge}
              value={indicadores.tendenciaTurbidez7Dias.variacao}
              comparison="Variação nos últimos 7 dias"
              trend={indicadores.tendenciaTurbidez7Dias.tendencia as "baixa" | "alta" | "estavel"}
              unit=" NTU"
              colorScheme="purple"
            />
          </div>
        </section>

        {/* 2. Análises Micro */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--dashboard-text))]">Análises Micro</h2>
                <p className="text-sm text-[hsl(var(--dashboard-muted))]">
                  Monitoramento detalhado de pontos específicos
                </p>
              </div>
            </div>

           
          </div>

          {/* Monitoramento de Turbidez - Deque de Pedras */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[hsl(var(--dashboard-text))] flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <Droplets className="h-4 w-4 text-blue-400" />
                </div>
                Monitoramento de Turbidez - Deque de Pedras
              </CardTitle>
              <p className="text-sm text-[hsl(var(--dashboard-muted))]">
                Análise diária da qualidade da água no ponto de monitoramento
              </p>
            </CardHeader>
            <CardContent>
              <DailyDequeProvider>
                <GraficoTurbidezComparativo />
              </DailyDequeProvider>
            </CardContent>
          </Card>

          {/* Ponte do Cure */}
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[hsl(var(--dashboard-text))] flex items-center gap-2">
                <div className="w-8 h-8 bg-pantaneiro-lime/20 rounded-lg flex items-center justify-center border border-pantaneiro-lime/30">
                  <MapPin className="h-4 w-4 text-pantaneiro-lime" />
                </div>
                Monitoramento - Ponte do Cure
              </CardTitle>
              <p className="text-sm text-[hsl(var(--dashboard-muted))]">Dados ambientais coletados na Ponte do Cure</p>
            </CardHeader>
            <CardContent>
              <DailyPonteCureProvider>
                <GraficoPonteCure />
              </DailyPonteCureProvider>
            </CardContent>
          </Card>
        </section>

        {/* 3. Análises Macro */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pantaneiro-green rounded-lg flex items-center justify-center">
                <Globe className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[hsl(var(--dashboard-text))]">Análises Macro</h2>
                <p className="text-sm text-[hsl(var(--dashboard-muted))]">Visão regional dos indicadores ambientais</p>
              </div>
            </div>

            {/* Local Year Control for Macro */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[hsl(var(--dashboard-muted))]">Filtrar por ano:</span>
              <Select value={anoSelecionado} onValueChange={handleAnoChange}>
                <SelectTrigger className="w-[160px] bg-[hsl(var(--dashboard-accent))] border-[hsl(var(--dashboard-accent))] text-[hsl(var(--dashboard-text))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(var(--dashboard-card))] border-[hsl(var(--dashboard-accent))] text-white">
                  <SelectItem value="todos">Período Completo</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[hsl(var(--dashboard-text))] flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                    <Flame className="h-4 w-4 text-red-400" />
                  </div>
                  Focos de Incêndio
                </CardTitle>
                <p className="text-sm text-[hsl(var(--dashboard-muted))]">Distribuição temporal de focos detectados</p>
              </CardHeader>
              <CardContent>
                <GraficoFogo />
              </CardContent>
            </Card>

            <Card className=" shadow-md hover:shadow-lg transition-shadow duration-300 bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[hsl(var(--dashboard-text))] flex items-center gap-2">
                  <div className="w-8 h-8 bg-pantaneiro-lime/20 rounded-lg flex items-center justify-center border border-pantaneiro-lime/30">
                    <TreePine className="h-4 w-4 text-pantaneiro-lime" />
                  </div>
                  Desmatamento
                </CardTitle>
                <p className="text-sm text-[hsl(var(--dashboard-muted))]">Área desmatada por período</p>
              </CardHeader>
              <CardContent>
                <GraficoDesmatamento />
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[hsl(var(--dashboard-text))] flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                  </div>
                  Ações Realizadas
                </CardTitle>
                <p className="text-sm text-[hsl(var(--dashboard-muted))]">Distribuição de ações por categoria</p>
              </CardHeader>
              <CardContent>
                <GraficoAcoes />
              </CardContent>
            </Card>

            <Card className=" shadow-md hover:shadow-lg transition-shadow duration-300 bg-[hsl(var(--dashboard-card))] border border-[hsl(var(--dashboard-accent))]">
              <CardHeader className="pb-4">
                <CardTitle className="text-[hsl(var(--dashboard-text))] flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  Pontos de Monitoramento Consolidados
                </CardTitle>
                <p className="text-sm text-[hsl(var(--dashboard-muted))]">Dados consolidados dos pontos de coleta</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-[hsl(var(--dashboard-text))] mb-3">Deque de Pedras</h4>
                    <GraficoPontos ponto="deque" ano={anoSelecionado} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[hsl(var(--dashboard-text))] mb-3">Ponte do Cure</h4>
                    <GraficoPontos ponto="ponte" ano={anoSelecionado} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
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