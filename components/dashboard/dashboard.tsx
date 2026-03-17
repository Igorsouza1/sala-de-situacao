"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ComposedChart,
  Line,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KpiCard } from "./kpis/KpiCard";
import type { KpiColorScheme, KpiTrend } from "./kpis/KpiCard";
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
import {
  BalnearioMunicipalProvider,
  useBalnearioMunicipal,
} from "@/context/BalnearioMunicipalContext";
import { DailyDequeProvider, useDailyDeque } from "@/context/DailyDequeContext";
import {
  DailyBalnearioProvider,
  useDailyBalneario,
} from "@/context/DailyBalnearioContext";
import {
  Leaf,
  Flame,
  TreePine,
  Droplets,
  CloudRain,
  Waves,
  Droplet,
  Eye,
  Activity,
  MapPin,
  PawPrint,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface KpiData<T> {
  data: T | null;
  loading: boolean;
}

interface FocosIndicador {
  current: number;
  previous: number;
  deltaPct: number | null;
  sparkline: number[];
}

interface DesmatamentoIndicador {
  currentHa: number;
  lastHa: number;
  deltaPct: number | null;
  sparkline: number[];
  year: number;
}

interface NivelAguaIndicador {
  current: number | null;
  deltaPct: number | null;
}

interface SecchiIndicador {
  current: number | null;
  deltaPct: number | null;
}

interface TurbidezIndicador {
  current: number | null;
  deltaPct: number | null;
  sparkline: number[];
  status: "normal" | "atencao" | "critico";
  secchiVertical: number | null;
  lastDate: string | null;
}

interface ChuvaIndicador {
  mtdAtual: number | null;
  deltaPct: number | null;
}

interface JavaliIndicador {
  total: number;
  thisMonth: number;
  lastMonth: number;
  deltaPct: number | null;
  sparkline: number[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function useFetch<T>(url: string): KpiData<T> {
  const [state, setState] = useState<KpiData<T>>({ data: null, loading: true });
  useEffect(() => {
    fetch(url)
      .then((r) => r.json())
      .then((json) =>
        setState({ data: json?.success ? json.data : null, loading: false })
      )
      .catch(() => setState({ data: null, loading: false }));
  }, [url]);
  return state;
}

function trendFromDelta(delta: number | null | undefined): KpiTrend {
  if (delta == null || !Number.isFinite(delta)) return "estavel";
  if (delta > 1) return "alta";
  if (delta < -1) return "baixa";
  return "estavel";
}

function fmtPct(
  delta: number | null | undefined,
  suffix: string
): string | undefined {
  if (delta == null || !Number.isFinite(delta)) return undefined;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}% ${suffix}`;
}

function turbidezScheme(
  status: "normal" | "atencao" | "critico"
): KpiColorScheme {
  if (status === "critico") return "danger";
  if (status === "atencao") return "warning";
  return "success";
}

function fmtDate(iso: string | Date): string {
  try {
    const d = iso instanceof Date ? iso : parseISO(iso);
    return format(d, "dd/MM", { locale: ptBR });
  } catch {
    return String(iso);
  }
}

function fmtNum(v: number | null | undefined, dec = 1): string {
  if (v == null) return "—";
  return Number(v).toLocaleString("pt-BR", { maximumFractionDigits: dec });
}

function safeNum(v: any, dec = 2): number {
  const n = Number(v);
  return Number.isFinite(n) ? Number(n.toFixed(dec)) : 0;
}

// ─── Turbidez reference bands ─────────────────────────────────────────────────

const TURB_BANDS = [
  { y1: 0,   y2: 3,   fill: "#10b98118" },
  { y1: 3,   y2: 7,   fill: "#eab30818" },
  { y1: 7,   y2: 15,  fill: "#f9731618" },
  { y1: 15,  y2: 500, fill: "#ef444418" },
] as const;

// ─── Mini chart tooltip ───────────────────────────────────────────────────────

function MiniTooltipFormoso({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const fv = (v: number) =>
    Number.isFinite(v) && v > 0
      ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
      : "—";
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-foreground">{d?.diaFmt}</p>
      {d?.turbidez > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Turbidez</span>
          <span className="font-medium text-[hsl(var(--chart-3))]">{fv(d.turbidez)} NTU</span>
        </div>
      )}
      {d?.secchiVert > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Secchi</span>
          <span className="font-medium text-[hsl(var(--chart-4))]">{fv(d.secchiVert)} m</span>
        </div>
      )}
      {d?.pluviometria > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Chuva</span>
          <span className="font-medium text-sky-400">{fv(d.pluviometria)} mm</span>
        </div>
      )}
    </div>
  );
}

function MiniTooltipPrata({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const fv = (v: number) =>
    Number.isFinite(v) && v > 0
      ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
      : "—";
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs space-y-1 min-w-[140px]">
      <p className="font-semibold text-foreground">{d?.diaFmt}</p>
      {d?.turbidez > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Turbidez</span>
          <span className="font-medium text-[hsl(var(--chart-3))]">{fv(d.turbidez)} NTU</span>
        </div>
      )}
      {d?.chuva > 0 && (
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Chuva</span>
          <span className="font-medium text-sky-400">{fv(d.chuva)} mm</span>
        </div>
      )}
    </div>
  );
}

const MINI_AXIS = {
  fontSize: 10,
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
} as const;

// ─── Compact Header ────────────────────────────────────────────────────────────

function DashboardHeader() {
  const now = new Date();
  const dateLabel = format(now, "EEE, dd MMM yyyy", { locale: ptBR });
  const timeLabel = format(now, "HH:mm");

  return (
    <header className="flex-none border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 h-14">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center flex-none shadow-sm">
            <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.18em]">
              PRISMA
            </span>
            <span className="text-border">·</span>
            <span className="text-sm font-semibold text-foreground">
              Sala de Situação
            </span>
            <span className="text-border">·</span>
            <span className="text-xs text-muted-foreground">Bonito / MS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground capitalize hidden sm:block">
            {dateLabel}
          </span>
          <span className="font-mono text-sm font-semibold text-foreground tabular-nums">
            {timeLabel}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">
              Ativo
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Mini Chart — Rio Formoso (Balneário Municipal) ───────────────────────────

function PainelFormoso() {
  const { raw, isLoading } = useDailyBalneario();

  const data = useMemo(() => {
    return [...raw]
      .filter((e) => e.data)
      .sort((a, b) => new Date(a.data!).getTime() - new Date(b.data!).getTime())
      .slice(-30)
      .map((e) => ({
        diaFmt: fmtDate(String(e.data!)),
        turbidez: safeNum(e.turbidez, 2),
        secchiVert: safeNum(e.secchiVertical, 2),
        pluviometria: safeNum(e.pluviometria, 1),
      }));
  }, [raw]);

  const lastEntry = useMemo(
    () =>
      raw.length
        ? [...raw]
            .filter((e) => e.data)
            .sort((a, b) => new Date(b.data!).getTime() - new Date(a.data!).getTime())[0] ?? null
        : null,
    [raw]
  );

  return (
    <div className="bg-card border border-border/70 rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/50 flex-none bg-muted/20">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-none">
          <Waves className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-none">Rio Formoso</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Balneário Municipal · Turbidez · Secchi · Chuva</p>
        </div>
        {lastEntry && (
          <div className="flex flex-col items-end gap-0.5 flex-none">
            <span className="text-[10px] text-muted-foreground">Último registro</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">{fmtDate(lastEntry.data!)}</span>
          </div>
        )}
        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20 flex-none ml-2">
          <MapPin className="w-2.5 h-2.5 text-blue-500" />
          <span className="text-[9px] font-semibold text-blue-500 uppercase tracking-wide">Formoso</span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 px-2 pt-3 pb-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-xs">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Carregando…
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Sem dados recentes</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              turbidez:    { label: "Turbidez (NTU)",   color: "hsl(var(--chart-3))" },
              secchiVert:  { label: "Secchi Vert. (m)", color: "hsl(var(--chart-4))" },
              pluviometria:{ label: "Chuva (mm)",        color: "hsl(var(--chart-2))" },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 40, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />

                {/* Turbidez bands */}
                {TURB_BANDS.map((b) => (
                  <ReferenceArea key={b.y1} yAxisId="turb" y1={b.y1} y2={b.y2} fill={b.fill} stroke="none" />
                ))}

                <XAxis
                  dataKey="diaFmt"
                  {...MINI_AXIS}
                  interval="preserveStartEnd"
                />

                {/* Left: Turbidez */}
                <YAxis
                  yAxisId="turb"
                  orientation="left"
                  {...MINI_AXIS}
                  stroke="hsl(var(--chart-3))"
                  width={28}
                  domain={[0, (d: number) => Math.ceil((d || 10) * 1.2)]}
                  tickFormatter={(v) => String(v)}
                />

                {/* Right: Secchi */}
                <YAxis
                  yAxisId="secchi"
                  orientation="right"
                  {...MINI_AXIS}
                  stroke="hsl(var(--chart-4))"
                  width={28}
                  domain={[0, (d: number) => Math.ceil((d || 5) * 1.3)]}
                  tickFormatter={(v) => v.toFixed(1)}
                />

                {/* Chuva bars */}
                <Bar
                  dataKey="pluviometria"
                  yAxisId="turb"
                  fill="var(--color-pluviometria)"
                  fillOpacity={0.18}
                  stroke="var(--color-pluviometria)"
                  strokeOpacity={0.4}
                  barSize={4}
                  radius={[2, 2, 0, 0]}
                />

                {/* Turbidez line */}
                <Line
                  yAxisId="turb"
                  dataKey="turbidez"
                  stroke="var(--color-turbidez)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 2, stroke: "#fff" }}
                />

                {/* Secchi line */}
                <Line
                  yAxisId="secchi"
                  dataKey="secchiVert"
                  stroke="var(--color-secchiVert)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 2, stroke: "#fff" }}
                />

                <Tooltip
                  content={<MiniTooltipFormoso />}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>

      {/* Legend footer */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border/30 bg-muted/10 flex-none">
        <LegendaItem color="hsl(var(--chart-3))" label="Turbidez (NTU)" line />
        <LegendaItem color="hsl(var(--chart-4))" label="Secchi (m)" line />
        <LegendaItem color="hsl(var(--chart-2))" label="Chuva (mm)" />
      </div>
    </div>
  );
}

// ─── Mini Chart — Rio da Prata (Deque de Pedras) ─────────────────────────────

function PainelPrata() {
  const { raw, isLoading } = useDailyDeque();

  const data = useMemo(() => {
    return [...raw]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(-30)
      .map((e) => ({
        diaFmt: fmtDate(String(e.data)),
        turbidez: safeNum(e.turbidez, 2),
        chuva: safeNum(e.chuva, 1),
      }));
  }, [raw]);

  const lastEntry = useMemo(
    () =>
      raw.length
        ? [...raw].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0] ?? null
        : null,
    [raw]
  );

  function turbStatus(v: number): { label: string; color: string } {
    if (v <= 3) return { label: "Excelente", color: "text-emerald-400" };
    if (v <= 7) return { label: "Atenção", color: "text-yellow-400" };
    if (v <= 15) return { label: "Regular", color: "text-orange-400" };
    return { label: "Crítico", color: "text-red-400" };
  }

  const lastTurb = lastEntry?.turbidez != null ? safeNum(lastEntry.turbidez, 1) : null;
  const status = lastTurb != null ? turbStatus(lastTurb) : null;

  return (
    <div className="bg-card border border-border/70 rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/50 flex-none bg-muted/20">
        <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-none">
          <Droplets className="w-3.5 h-3.5 text-teal-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-none">Rio da Prata</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Deque de Pedras · Turbidez · Chuva</p>
        </div>
        {lastTurb != null && status && (
          <div className="flex flex-col items-end gap-0.5 flex-none">
            <span className="text-[10px] text-muted-foreground">Turbidez atual</span>
            <span className={`text-xs font-bold tabular-nums ${status.color}`}>
              {fmtNum(lastTurb)} NTU · {status.label}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-500/10 rounded-full border border-teal-500/20 flex-none ml-2">
          <MapPin className="w-2.5 h-2.5 text-teal-500" />
          <span className="text-[9px] font-semibold text-teal-500 uppercase tracking-wide">Prata</span>
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 px-2 pt-3 pb-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-xs">
            <div className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            Carregando…
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Sem dados recentes</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              turbidez: { label: "Turbidez (NTU)", color: "hsl(var(--chart-3))" },
              chuva:    { label: "Chuva (mm)",      color: "hsl(var(--chart-2))" },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 40, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />

                {/* Turbidez bands */}
                {TURB_BANDS.map((b) => (
                  <ReferenceArea key={b.y1} yAxisId="turb" y1={b.y1} y2={b.y2} fill={b.fill} stroke="none" />
                ))}

                <XAxis
                  dataKey="diaFmt"
                  {...MINI_AXIS}
                  interval="preserveStartEnd"
                />

                {/* Left: Turbidez */}
                <YAxis
                  yAxisId="turb"
                  orientation="left"
                  {...MINI_AXIS}
                  stroke="hsl(var(--chart-3))"
                  width={28}
                  domain={[0, (d: number) => Math.ceil((d || 10) * 1.2)]}
                  tickFormatter={(v) => String(v)}
                />

                {/* Right: Chuva */}
                <YAxis
                  yAxisId="chuva"
                  orientation="right"
                  {...MINI_AXIS}
                  stroke="hsl(var(--chart-2))"
                  width={28}
                  domain={[0, (d: number) => Math.ceil((d || 20) * 1.3)]}
                  tickFormatter={(v) => String(v)}
                />

                {/* Chuva bars */}
                <Bar
                  dataKey="chuva"
                  yAxisId="chuva"
                  fill="var(--color-chuva)"
                  fillOpacity={0.25}
                  stroke="var(--color-chuva)"
                  strokeOpacity={0.5}
                  barSize={5}
                  radius={[2, 2, 0, 0]}
                />

                {/* Turbidez line */}
                <Line
                  yAxisId="turb"
                  dataKey="turbidez"
                  stroke="var(--color-turbidez)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 2, stroke: "#fff" }}
                />

                <Tooltip
                  content={<MiniTooltipPrata />}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </div>

      {/* Legend footer */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border/30 bg-muted/10 flex-none">
        <LegendaItem color="hsl(var(--chart-3))" label="Turbidez (NTU)" line />
        <LegendaItem color="hsl(var(--chart-2))" label="Chuva (mm)" />
        <div className="ml-auto flex items-center gap-3">
          {[
            { fill: "#10b98140", label: "≤3" },
            { fill: "#eab30840", label: "4–7" },
            { fill: "#f9731640", label: "8–15" },
            { fill: "#ef444440", label: ">15" },
          ].map(({ fill, label }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: fill }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Legenda item helper ───────────────────────────────────────────────────────

function LegendaItem({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {line ? (
        <svg width="16" height="8" className="flex-none">
          <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      ) : (
        <span className="w-3 h-2.5 rounded-sm flex-none opacity-60 border" style={{ background: color, borderColor: color }} />
      )}
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Últimos Registros Formoso (tabela) ───────────────────────────────────────

interface RawBalnearioRow {
  id: number;
  data: string | null;
  nivelAgua: string | number | null;
  secchiVertical: string | number | null;
  pluviometria: string | number | null;
  turbidez: string | number | null;
}

function parseVal(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function UltimosRegistrosFormoso() {
  const [entries, setEntries] = useState<RawBalnearioRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const end   = format(new Date(), "yyyy-MM-dd");
    const start = format(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
    fetch(`/api/balneario-municipal/daily?startDate=${start}&endDate=${end}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          // API already returns DESC via orderBy; filter rows that have at least one measurement
          const filtered = (json.data as RawBalnearioRow[]).filter(
            (r) =>
              parseVal(r.nivelAgua) != null ||
              parseVal(r.secchiVertical) != null ||
              parseVal(r.pluviometria) != null ||
              parseVal(r.turbidez) != null
          );
          setEntries(filtered.slice(0, 12));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card border border-border/70 rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border/50 flex-none bg-muted/20">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-none">
          <Waves className="w-3.5 h-3.5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-none">Últimos Registros — Rio Formoso</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Balneário Municipal · coletas mais recentes</p>
        </div>
        {entries[0] && (
          <span className="text-[10px] text-muted-foreground flex-none">
            Atualizado em{" "}
            <span className="font-semibold text-foreground">
              {fmtDate(entries[0].data!)}
            </span>
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-xs">
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Carregando…
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-muted-foreground">Sem dados nos últimos 90 dias</p>
          </div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
              <tr className="border-b border-border/40">
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nível</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Secchi</th>
                <th className="px-4 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Chuva</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const nivel   = parseVal(e.nivelAgua);
                const secchi  = parseVal(e.secchiVertical);
                const chuva   = parseVal(e.pluviometria);
                return (
                  <tr
                    key={String(e.data) + i}
                    className={`border-b border-border/20 hover:bg-muted/30 transition-colors ${i === 0 ? "bg-blue-500/5" : ""}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground tabular-nums">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-none" />}
                        {e.data ? fmtDate(e.data) : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className="text-blue-400 font-semibold">{fmtNum(nivel, 1)}</span>
                      <span className="text-muted-foreground/60 ml-1 text-[10px]">m</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className="text-emerald-400 font-semibold">{fmtNum(secchi)}</span>
                      <span className="text-muted-foreground/60 ml-1 text-[10px]">m</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className="text-sky-400 font-semibold">{fmtNum(chuva)}</span>
                      <span className="text-muted-foreground/60 ml-1 text-[10px]">mm</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border/30 bg-muted/10 flex-none flex-wrap">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-[10px] text-muted-foreground">Nível (m)</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[10px] text-muted-foreground">Secchi (m)</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-400" /><span className="text-[10px] text-muted-foreground">Chuva (mm)</span></div>
      </div>
    </div>
  );
}

function turbColor(v: number | null): string {
  if (v == null) return "hsl(var(--muted-foreground))";
  if (v <= 3) return "#10b981";
  if (v <= 7) return "#eab308";
  if (v <= 15) return "#f97316";
  return "#ef4444";
}

// ─── Tab: Visão Geral (Bento Box) ─────────────────────────────────────────────

function TabVisaoGeral() {
  const focos       = useFetch<FocosIndicador>("/api/fogo/indicador");
  const desmatamento = useFetch<DesmatamentoIndicador>("/api/desmatamento/indicador");
  const nivelAgua   = useFetch<NivelAguaIndicador>("/api/balneario-municipal/indicadores/nivel-agua");
  const secchi      = useFetch<SecchiIndicador>("/api/balneario-municipal/indicadores/secchi");
  const javali      = useFetch<JavaliIndicador>("/api/javali-avistamentos/indicador");

  const focosTrend  = trendFromDelta(focos.data?.deltaPct);
  const desmatTrend = trendFromDelta(desmatamento.data?.deltaPct);
  const nivelTrend  = trendFromDelta(nivelAgua.data?.deltaPct);
  const secchiTrend = trendFromDelta(secchi.data?.deltaPct);
  const javaliTrend = trendFromDelta(javali.data?.deltaPct);

  const javaliValue = javali.data === null ? null : javali.data.total === 0 ? "(0)" : javali.data.total;
  const javaliUnit  = javali.data?.total === 0 ? "" : "relatos";

  return (
    <div className="h-full grid grid-rows-[auto_1fr] gap-4 p-4 overflow-hidden">
      {/* ── Row 1: 5 KPIs ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KpiCard
          title="Focos de Incêndio"
          icon={Flame}
          value={focos.data?.current ?? null}
          unit="focos"
          trend={focosTrend}
          trendSemantic="negativo"
          trendLabel={fmtPct(focos.data?.deltaPct, "vs 30 dias atrás")}
          sparklineData={focos.data?.sparkline}
          colorScheme={focosTrend === "alta" ? "danger" : focosTrend === "baixa" ? "success" : "info"}
          tooltip="Focos de calor detectados via satélite VIIRS nos últimos 30 dias."
          loading={focos.loading}
        />
        <KpiCard
          title="Alertas Desmatamento"
          icon={TreePine}
          value={desmatamento.data?.currentHa ?? null}
          unit="ha"
          trend={desmatTrend}
          trendSemantic="negativo"
          trendLabel={fmtPct(desmatamento.data?.deltaPct, `vs ${(desmatamento.data?.year ?? new Date().getFullYear()) - 1}`)}
          sparklineData={desmatamento.data?.sparkline}
          colorScheme={desmatTrend === "alta" ? "danger" : desmatTrend === "baixa" ? "success" : "info"}
          tooltip="Hectares com alertas de desmatamento no ano atual comparado ao anterior."
          loading={desmatamento.loading}
        />
        <KpiCard
          title="Nível — Formoso"
          icon={Droplet}
          value={nivelAgua.data?.current ?? null}
          unit="cm"
          trend={nivelTrend}
          trendSemantic="neutro"
          trendLabel={fmtPct(nivelAgua.data?.deltaPct, "vs mesmo período ano passado")}
          colorScheme="info"
          tooltip="Nível da água no Balneário Municipal — Rio Formoso."
          loading={nivelAgua.loading}
        />
        <KpiCard
          title="Secchi — Formoso"
          icon={Eye}
          value={secchi.data?.current ?? null}
          unit="m"
          trend={secchiTrend}
          trendSemantic="neutro"
          trendLabel={fmtPct(secchi.data?.deltaPct, "vs mesmo período ano passado")}
          colorScheme="info"
          tooltip="Transparência da água no Balneário Municipal (Secchi vertical). Maior = mais limpa."
          loading={secchi.loading}
        />
        <KpiCard
          title="Avistamentos Javali"
          icon={PawPrint}
          value={javaliValue}
          unit={javaliUnit}
          trend={javaliTrend}
          trendSemantic="negativo"
          trendLabel={fmtPct(javali.data?.deltaPct, "vs mês anterior")}
          sparklineData={javali.data?.sparkline}
          colorScheme={javaliTrend === "alta" ? "warning" : "info"}
          tooltip="Total de avistamentos de javali (Sus scrofa) registrados pelo formulário público e equipes de campo."
          loading={javali.loading}
        />
      </div>

      {/* ── Row 2: Últimos Registros Formoso ─────────────────── */}
      <div className="min-h-0">
        <UltimosRegistrosFormoso />
      </div>
    </div>
  );
}

// ─── Tab: Focos ───────────────────────────────────────────────────────────────

function TabFocos() {
  return (
    <div className="h-full overflow-auto p-4">
      <GraficoFogo />
    </div>
  );
}

// ─── Tab: Desmatamento ────────────────────────────────────────────────────────

function TabDesmatamento() {
  return (
    <div className="h-full overflow-auto p-4">
      <GraficoDesmatamento />
    </div>
  );
}

// ─── Tab: Formoso ─────────────────────────────────────────────────────────────

function TabFormoso() {
  const nivelAgua = useFetch<NivelAguaIndicador>(
    "/api/balneario-municipal/indicadores/nivel-agua"
  );
  const chuva = useFetch<ChuvaIndicador>(
    "/api/balneario-municipal/indicadores/pluviometria"
  );
  const secchi = useFetch<SecchiIndicador>(
    "/api/balneario-municipal/indicadores/secchi"
  );

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Nível da Água"
            icon={Droplet}
            value={nivelAgua.data?.current ?? null}
            unit="cm"
            trend={trendFromDelta(nivelAgua.data?.deltaPct)}
            trendSemantic="neutro"
            trendLabel={fmtPct(
              nivelAgua.data?.deltaPct,
              "vs mesmo período ano passado"
            )}
            colorScheme="info"
            loading={nivelAgua.loading}
          />
          <KpiCard
            title="Pluviometria"
            icon={CloudRain}
            value={chuva.data?.mtdAtual ?? null}
            unit="mm"
            trend={trendFromDelta(chuva.data?.deltaPct)}
            trendSemantic="neutro"
            trendLabel={fmtPct(
              chuva.data?.deltaPct,
              "vs mesmo período ano passado"
            )}
            colorScheme="info"
            loading={chuva.loading}
          />
          <KpiCard
            title="Secchi Vertical"
            icon={Eye}
            value={secchi.data?.current ?? null}
            unit="m"
            trend={trendFromDelta(secchi.data?.deltaPct)}
            trendSemantic="neutro"
            trendLabel={fmtPct(
              secchi.data?.deltaPct,
              "vs mesmo período ano passado"
            )}
            colorScheme="info"
            loading={secchi.loading}
          />
        </div>

        <GraficoNivelRioBalneario />
        <GraficoPluviometriaBalneario />
        <GraficoSecchiBalneario />
        <GraficoSaudeRio />
        <GraficoProximidadeBalneario />
      </div>
    </div>
  );
}

// ─── Tab: Prata ───────────────────────────────────────────────────────────────

function TabPrata({ anoSelecionado }: { anoSelecionado: string }) {
  const turbidez = useFetch<TurbidezIndicador>(
    "/api/deque-pedras/indicadores/turbidez"
  );
  const chuva = useFetch<ChuvaIndicador>("/api/deque-pedras/indicadores/chuva");

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Turbidez"
            icon={Droplets}
            value={turbidez.data?.current ?? null}
            unit="NTU"
            trend={trendFromDelta(turbidez.data?.deltaPct)}
            trendSemantic="negativo"
            trendLabel={fmtPct(turbidez.data?.deltaPct, "vs semana anterior")}
            sparklineData={turbidez.data?.sparkline}
            colorScheme={
              turbidez.data ? turbidezScheme(turbidez.data.status) : "info"
            }
            tooltip="Turbidez no Deque de Pedras. Verde ≤ 3, Amarelo 4–7, Laranja 8–15, Vermelho > 15 NTU."
            loading={turbidez.loading}
          />
          <KpiCard
            title="Pluviometria"
            icon={CloudRain}
            value={chuva.data?.mtdAtual ?? null}
            unit="mm"
            trend={trendFromDelta(chuva.data?.deltaPct)}
            trendSemantic="neutro"
            trendLabel={fmtPct(
              chuva.data?.deltaPct,
              "vs mesmo período ano passado"
            )}
            colorScheme="info"
            loading={chuva.loading}
          />
          <KpiCard
            title="Secchi Vertical"
            icon={Eye}
            value={turbidez.data?.secchiVertical ?? null}
            unit="m"
            trend="estavel"
            trendSemantic="neutro"
            trendLabel={
              turbidez.data?.lastDate
                ? `Coleta em ${turbidez.data.lastDate}`
                : undefined
            }
            colorScheme="info"
            loading={turbidez.loading}
          />
        </div>

        {/* Charts */}
        <GraficoTurbidezDiario />
        <GraficoPontos ponto="deque" ano={anoSelecionado} />
      </div>
    </div>
  );
}

// ─── Tab bar config ────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  { value: "visao-geral", label: "Visão Geral", icon: Activity },
  { value: "focos", label: "Focos", icon: Flame },
  { value: "desmatamento", label: "Desmatamento", icon: TreePine },
  { value: "formoso", label: "Formoso", icon: Waves },
  { value: "prata", label: "Prata", icon: Droplets },
] as const;

// ─── Main Dashboard Content ───────────────────────────────────────────────────

function DashboardContent() {
  const [anoSelecionado, setAnoSelecionado] = useState<string>("todos");
  const { setSelectedYear: setYearFogo } = useFogo();
  const { setSelectedYear: setYearDesmat } = useDesmatamento();
  const { setSelectedYear: setYearDeque } = useDequePedras();
  const { setSelectedYear: setYearPonte } = usePonteCure();
  const { setSelectedYear: setYearBalneario } = useBalnearioMunicipal();

  const handleAnoChange = (ano: string) => {
    setAnoSelecionado(ano);
    setYearFogo(ano);
    setYearDesmat(ano);
    setYearDeque(ano);
    setYearPonte(ano);
    setYearBalneario(ano);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background text-foreground relative">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(16,185,129,0.06),transparent)] pointer-events-none" />

      <DashboardHeader />

      <Tabs
        defaultValue="visao-geral"
        className="flex-1 flex flex-col min-h-0 relative z-10"
      >
        {/* ── Tab bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 border-b border-border/60 bg-background/70 backdrop-blur-sm flex-none">
          <TabsList className="h-11 bg-transparent border-none rounded-none gap-0 p-0">
            {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-all gap-1.5 text-sm font-medium"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Year selector — right side of tab bar */}
          <Select value={anoSelecionado} onValueChange={handleAnoChange}>
            <SelectTrigger className="w-36 h-8 text-xs bg-background/50 border-border/60 rounded-lg focus:ring-emerald-500/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border/60 text-foreground rounded-xl shadow-lg">
              <SelectItem value="todos">Período Completo</SelectItem>
              {["2021", "2022", "2023", "2024", "2025"].map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Tab content ─────────────────────────────────────── */}
        <div className="flex-1 min-h-0">
          <TabsContent
            value="visao-geral"
            className="h-full m-0 data-[state=inactive]:hidden"
          >
            <TabVisaoGeral />
          </TabsContent>

          <TabsContent
            value="focos"
            className="h-full m-0 data-[state=inactive]:hidden"
          >
            <TabFocos />
          </TabsContent>

          <TabsContent
            value="desmatamento"
            className="h-full m-0 data-[state=inactive]:hidden"
          >
            <TabDesmatamento />
          </TabsContent>

          <TabsContent
            value="formoso"
            className="h-full m-0 data-[state=inactive]:hidden"
          >
            <TabFormoso />
          </TabsContent>

          <TabsContent
            value="prata"
            className="h-full m-0 data-[state=inactive]:hidden"
          >
            <TabPrata anoSelecionado={anoSelecionado} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─── Export ────────────────────────────────────────────────────────────────────

export function DashboardAmbiental() {
  return (
    <AcoesProvider>
      <FogoProvider>
        <DesmatamentoProvider>
          <DequePedrasProvider>
            <PonteCureProvider>
              <BalnearioMunicipalProvider>
                <DailyDequeProvider>
                  <DailyBalnearioProvider>
                    <DashboardContent />
                  </DailyBalnearioProvider>
                </DailyDequeProvider>
              </BalnearioMunicipalProvider>
            </PonteCureProvider>
          </DequePedrasProvider>
        </DesmatamentoProvider>
      </FogoProvider>
    </AcoesProvider>
  );
}
