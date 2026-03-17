"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiSection } from "./kpis/KpiSection";
import { GraficoFogo } from "./charts/grafico-fogo";
import { GraficoDesmatamento } from "./charts/grafico-desmatamento";
import { GraficoPontos } from "./charts/grafico-pontos";
import { GraficoTurbidezDiario } from "./charts/GraficoTurbidezDiario";
import { GraficoNivelRioBalneario } from "./charts/GraficoNivelRioBalneario";
import { GraficoPluviometriaBalneario } from "./charts/GraficoPluviometriaBalneario";
import { GraficoSecchiBalneario } from "./charts/GraficoSecchiBalneario";
import { GraficoSaudeRio } from "./charts/GraficoSaudeRio";
import { GraficoProximidadeBalneario } from "./charts/GraficoProximidadeBalneario";
import { AcoesProvider } from "@/context/AcoesContext";
import { FogoProvider, useFogo } from "@/context/FogoContext";
import { DesmatamentoProvider, useDesmatamento } from "@/context/DesmatamentoContext";
import { DequePedrasProvider, useDequePedras } from "@/context/DequePedrasContext";
import { PonteCureProvider, usePonteCure } from "@/context/PonteCureContext";
import { BalnearioMunicipalProvider, useBalnearioMunicipal } from "@/context/BalnearioMunicipalContext";
import { DailyDequeProvider } from "@/context/DailyDequeContext";
import {
  Leaf,
  Globe,
  Zap,
  Waves,
  Flame,
  TreePine,
  Droplets,
  MapPin,
} from "lucide-react";

// ─── Dashboard Header ─────────────────────────────────────────────────────────

function DashboardHeader() {
  const now = new Date();
  const dateLabel = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const capitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <header className="border-b border-border/60 pb-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

        {/* Left — identity */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-sm flex-none">
            <Leaf className="w-6 h-6 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-[0.18em] leading-none mb-1">
              PRISMA
            </p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              Sala de Situação
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitoramento ambiental integrado — Bonito / MS
            </p>
          </div>
        </div>

        {/* Right — status + date */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">Sistema Ativo</span>
          </div>
          <p className="text-xs text-muted-foreground">{capitalized}</p>
        </div>

      </div>
    </header>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  iconClass,
  bgClass,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bgClass}`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
      </div>
      <div>
        <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard Content ───────────────────────────────────────────────────

function DashboardContent() {
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos");
  const { setSelectedYear: setSelectedYearFogo } = useFogo();
  const { setSelectedYear: setSelectedYearDesmatamento } = useDesmatamento();
  const { setSelectedYear: setSelectedYearDequePedras } = useDequePedras();
  const { setSelectedYear: setSelectedYearPonteCure } = usePonteCure();
  const { setSelectedYear: setSelectedYearBalneario } = useBalnearioMunicipal();

  const handleAnoChange = (ano: string) => {
    setAnoSelecionado(ano);
    setSelectedYearFogo(ano);
    setSelectedYearDesmatamento(ano);
    setSelectedYearDequePedras(ano);
    setSelectedYearPonteCure(ano);
    setSelectedYearBalneario(ano);
  };

  return (
    <div className="min-h-screen w-full bg-background relative text-foreground overflow-hidden">
      {/* Decorative Premium Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.12),rgba(16,185,129,0))] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_100%_100%,rgba(59,130,246,0.08),rgba(59,130,246,0))] pointer-events-none" />
      
      <div className="relative w-full max-w-screen-2xl mx-auto px-6 md:px-10 py-8 space-y-12 z-10">

        {/* ── Header ───────────────────────────────────────────── */}
        <DashboardHeader />

        {/* ── KPIs em Tempo Real ───────────────────────────────── */}
        <section>
          <SectionHeading
            icon={Zap}
            title="Indicadores em Tempo Real"
            subtitle="Leituras recentes dos pontos de monitoramento e ameaças detectadas"
            iconClass="text-amber-500"
            bgClass="bg-amber-500/10 border-amber-500/20"
          />
          <KpiSection />
        </section>

        {/* ── Balneário Municipal — Série Histórica ─────────────── */}
        <section className="space-y-5">
          <SectionHeading
            icon={Waves}
            title="Balneário Municipal — Série Histórica"
            subtitle="Nível do rio, pluviometria, transparência e saúde da água — Rio Formoso"
            iconClass="text-blue-500"
            bgClass="bg-blue-500/10 border-blue-500/20"
          />
          <GraficoNivelRioBalneario />
          <GraficoPluviometriaBalneario />
          <GraficoSecchiBalneario />
          <GraficoSaudeRio />
          <GraficoProximidadeBalneario />
        </section>

        {/* ── Análises Micro ────────────────────────────────────── */}
        <section className="space-y-4">
          <SectionHeading
            icon={Droplets}
            title="Análises Micro"
            subtitle="Monitoramento detalhado de pontos específicos"
            iconClass="text-blue-500"
            bgClass="bg-blue-500/10 border-blue-500/20"
          />

          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/10 rounded-md flex items-center justify-center border border-blue-500/20">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                </div>
                Turbidez Diária — Deque de Pedras
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Análise diária da qualidade da água no ponto de monitoramento
              </p>
            </CardHeader>
            <CardContent>
              <DailyDequeProvider>
                <GraficoTurbidezDiario />
              </DailyDequeProvider>
            </CardContent>
          </Card>
        </section>

        {/* ── Análises Macro ────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeading
              icon={Globe}
              title="Análises Macro"
              subtitle="Visão regional dos indicadores ambientais"
              iconClass="text-emerald-500"
              bgClass="bg-emerald-500/10 border-emerald-500/20"
            />

            <div className="flex items-center gap-2 -mt-6">
              <span className="text-xs text-muted-foreground hidden sm:block">
                Filtrar por ano:
              </span>
              <Select value={anoSelecionado} onValueChange={handleAnoChange}>
                <SelectTrigger className="w-[150px] h-8 text-xs bg-card border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground text-xs">
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

          {/* Ameaças ambientais — Fogo + Desmatamento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <GraficoFogo />
            <GraficoDesmatamento />
          </div>

          {/* Pontos consolidados — full width */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/10 rounded-md flex items-center justify-center border border-blue-500/20">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                </div>
                Pontos de Monitoramento Consolidados
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Dados consolidados dos pontos de coleta
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Deque de Pedras
                  </h4>
                  <GraficoPontos ponto="deque" ano={anoSelecionado} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Ponte do Cure
                  </h4>
                  <GraficoPontos ponto="ponte" ano={anoSelecionado} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Balneário Municipal
                  </h4>
                  <GraficoPontos ponto="balneario" ano={anoSelecionado} />
                </div>
              </div>
            </CardContent>
          </Card>

        </section>

      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function DashboardAmbiental() {
  return (
    <AcoesProvider>
      <FogoProvider>
        <DesmatamentoProvider>
          <DequePedrasProvider>
            <PonteCureProvider>
              <BalnearioMunicipalProvider>
                <DashboardContent />
              </BalnearioMunicipalProvider>
            </PonteCureProvider>
          </DequePedrasProvider>
        </DesmatamentoProvider>
      </FogoProvider>
    </AcoesProvider>
  );
}
