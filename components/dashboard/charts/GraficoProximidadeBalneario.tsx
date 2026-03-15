"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart, Bar,
  AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip,
  ReferenceArea, Cell,
  ResponsiveContainer,
} from "recharts"
import { format, subDays, differenceInCalendarDays, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CloudRain, Droplet, Eye, Clock } from "lucide-react"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Preset = 7 | 15 | 30 | 90

interface RawRow {
  data: string
  nivelAgua:      string | null
  pluviometria:   string | null
  secchiVertical: string | null
}

interface DataPoint {
  dateStr:       string   // "2024-03-15"
  label:         string   // "15/03"
  nivelAgua:     number | null
  pluviometria:  number
  secchi:        number | null
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const PRESETS: { label: string; days: Preset }[] = [
  { label: "7 d",  days: 7  },
  { label: "15 d", days: 15 },
  { label: "30 d", days: 30 },
  { label: "90 d", days: 90 },
]

const SECCHI_BANDS = [
  { y1: 0,   y2: 0.5, fill: "#ef444414" },
  { y1: 0.5, y2: 1.5, fill: "#f9731614" },
  { y1: 1.5, y2: 3.0, fill: "#22c55e10" },
  { y1: 3.0, y2: 12,  fill: "#06b6d410" },
]

function secchiColor(v: number | null): string {
  if (v === null) return "hsl(var(--muted-foreground))"
  if (v < 0.5) return "#ef4444"
  if (v < 1.5) return "#f97316"
  if (v < 3.0) return "#22c55e"
  return "#06b6d4"
}

function secchiLabel(v: number | null): string {
  if (v === null) return "—"
  if (v < 0.5) return "Turva"
  if (v < 1.5) return "Moderada"
  if (v < 3.0) return "Boa"
  return "Excelente"
}

function fmtDate(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

// ─── Helpers de formatação do eixo X ─────────────────────────────────────────

function xInterval(days: Preset): number {
  if (days <= 7)  return 0   // todos os dias
  if (days <= 15) return 1   // a cada 2 dias
  if (days <= 30) return 3   // a cada 4 dias
  return 6                   // a cada 7 dias
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  color = "hsl(var(--foreground))",
}: {
  icon: React.ElementType
  label: string
  value: string
  unit?: string
  sub?: string
  color?: string
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border bg-muted/30 flex-1 min-w-[120px]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-none mt-0.5"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold truncate" style={{ color }}>{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Toggle de preset ─────────────────────────────────────────────────────────

function PresetToggle({ value, onChange }: { value: Preset; onChange: (v: Preset) => void }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/60">
      {PRESETS.map(({ label, days }) => (
        <button
          key={days}
          onClick={() => onChange(days)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
            value === days
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Painéis do gráfico ───────────────────────────────────────────────────────

// Painel 1: Pluviometria (barras)
function PainelChuva({ data, preset }: { data: DataPoint[]; preset: Preset }) {
  const yMax = useMemo(() => {
    const m = Math.max(...data.map((d) => d.pluviometria), 10)
    return Math.ceil((m * 1.2) / 5) * 5
  }, [data])

  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-1">
        <CloudRain className="w-3 h-3 text-blue-400" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Pluviometria (mm)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={data} syncId="balneario-prox" margin={{ top: 4, right: 8, left: 38, bottom: 0 }} barCategoryGap="40%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis
            domain={[0, yMax]} tickLine={false} axisLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            width={36} unit="mm" tickCount={3}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d: DataPoint = payload[0]?.payload
              return (
                <div className="rounded-lg border border-border bg-background/95 shadow-lg px-3 py-2 text-xs">
                  <p className="text-muted-foreground font-medium mb-1">{d.dateStr}</p>
                  <p>
                    <span className="text-blue-400 font-semibold">{d.pluviometria.toFixed(1)} mm</span>
                    {" "}de chuva
                  </p>
                </div>
              )
            }}
            cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
          />
          <Bar dataKey="pluviometria" radius={[2, 2, 0, 0]} maxBarSize={20}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.pluviometria > 50 ? "hsl(225,80%,42%)" : d.pluviometria > 0 ? "hsl(210,80%,65%)" : "hsl(var(--muted))"}
                fillOpacity={d.pluviometria > 0 ? 0.85 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Painel 2: Nível da Água (linha + área)
function PainelNivel({ data, preset }: { data: DataPoint[]; preset: Preset }) {
  const [yMin, yMax] = useMemo(() => {
    const vals = data.map((d) => d.nivelAgua).filter((v): v is number => v !== null)
    if (!vals.length) return [0, 100]
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.3 || 5
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)]
  }, [data])

  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-1">
        <Droplet className="w-3 h-3 text-blue-500" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Nível da Água (cm)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={data} syncId="balneario-prox" margin={{ top: 4, right: 8, left: 38, bottom: 0 }}>
          <defs>
            <linearGradient id="nivelGradProx" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(217,91%,60%)" stopOpacity={0.2} />
              <stop offset="90%" stopColor="hsl(217,91%,60%)" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis dataKey="label" hide />
          <YAxis
            domain={[yMin, yMax]} tickLine={false} axisLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            width={36} unit="cm" tickCount={3}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d: DataPoint = payload[0]?.payload
              return (
                <div className="rounded-lg border border-border bg-background/95 shadow-lg px-3 py-2 text-xs">
                  <p className="text-muted-foreground font-medium mb-1">{d.dateStr}</p>
                  <p>
                    <span className="text-blue-500 font-semibold">
                      {d.nivelAgua !== null ? `${d.nivelAgua.toFixed(1)} cm` : "—"}
                    </span>
                    {" "}nível da água
                  </p>
                </div>
              )
            }}
            cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
          />
          <Area
            type="monotone" dataKey="nivelAgua"
            stroke="hsl(217,91%,60%)" strokeWidth={2}
            fill="url(#nivelGradProx)"
            connectNulls={false} dot={false}
            activeDot={{ r: 4, fill: "hsl(217,91%,60%)", stroke: "hsl(var(--background))", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Painel 3: Secchi (barras com bandas de qualidade + eixo X)
function PainelSecchi({ data, preset }: { data: DataPoint[]; preset: Preset }) {
  const yMax = useMemo(() => {
    const vals = data.map((d) => d.secchi).filter((v): v is number => v !== null)
    if (!vals.length) return 4
    return Math.max(4, Math.ceil((Math.max(...vals) * 1.3) / 0.5) * 0.5)
  }, [data])

  return (
    <div>
      <div className="flex items-center gap-2 px-1 mb-1">
        <Eye className="w-3 h-3 text-cyan-500" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Disco de Secchi (m)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} syncId="balneario-prox" margin={{ top: 4, right: 8, left: 38, bottom: 20 }} barCategoryGap="40%">

          {SECCHI_BANDS.map((b) => (
            <ReferenceArea key={b.y1} y1={b.y1} y2={Math.min(b.y2, yMax)} fill={b.fill} stroke="none" ifOverflow="hidden" />
          ))}

          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false} axisLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            interval={xInterval(preset)}
            height={22}
          />
          <YAxis
            domain={[0, yMax]} tickLine={false} axisLine={false}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            width={36} unit=" m" tickCount={4}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d: DataPoint = payload[0]?.payload
              const color = secchiColor(d.secchi)
              return (
                <div className="rounded-lg border border-border bg-background/95 shadow-lg px-3 py-2 text-xs">
                  <p className="text-muted-foreground font-medium mb-1">{d.dateStr}</p>
                  <p>
                    <span className="font-semibold" style={{ color }}>
                      {d.secchi !== null ? `${d.secchi.toFixed(2)} m` : "—"}
                    </span>
                    {d.secchi !== null && <span className="text-muted-foreground ml-1">— {secchiLabel(d.secchi)}</span>}
                  </p>
                </div>
              )
            }}
            cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.4 }}
          />
          <Bar dataKey="secchi" radius={[3, 3, 0, 0]} maxBarSize={20}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={secchiColor(d.secchi)}
                fillOpacity={d.secchi !== null ? 0.8 : 0.2}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GraficoProximidadeBalneario() {
  const [preset, setPreset]   = useState<Preset>(30)
  const [raw,    setRaw]      = useState<RawRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const end   = new Date()
    const start = subDays(end, preset)
    const params = new URLSearchParams({
      startDate: fmtDate(start),
      endDate:   fmtDate(end),
    })

    fetch(`/api/balneario-municipal/daily?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setRaw(json.data)
        else setError("Falha ao carregar dados")
      })
      .catch(() => setError("Erro de conexão"))
      .finally(() => setLoading(false))
  }, [preset])

  const data: DataPoint[] = useMemo(() => {
    const toN = (v: string | null) => (v == null ? NaN : Number(v))
    return raw
      .filter((r) => !!r.data)
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((r) => {
        const dateObj = parseISO(r.data)
        return {
          dateStr:      r.data,
          label:        format(dateObj, "dd/MM"),
          nivelAgua:    Number.isFinite(toN(r.nivelAgua))    ? Math.round(toN(r.nivelAgua) * 100) / 100    : null,
          pluviometria: Number.isFinite(toN(r.pluviometria)) ? Math.round(toN(r.pluviometria) * 10) / 10   : 0,
          secchi:       Number.isFinite(toN(r.secchiVertical)) ? Math.round(toN(r.secchiVertical) * 100) / 100 : null,
        }
      })
  }, [raw])

  // ── Stat cards ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const lastNivel  = [...data].reverse().find((d) => d.nivelAgua  !== null)
    const lastSecchi = [...data].reverse().find((d) => d.secchi     !== null)
    const lastChuva  = [...data].reverse().find((d) => d.pluviometria > 0)

    const totalChuva = data.reduce((s, d) => s + d.pluviometria, 0)

    const diasSemChuva = lastChuva
      ? differenceInCalendarDays(new Date(), parseISO(lastChuva.dateStr))
      : null

    return { lastNivel, lastSecchi, lastChuva, totalChuva, diasSemChuva }
  }, [data])

  const hasData = data.length > 0

  return (
    <Card className="border-border bg-card shadow-sm w-full">
      <CardHeader className="pb-3 px-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Monitoramento Diário — Balneário Municipal
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Nível da água, pluviometria e transparência (Secchi) — dados por coleta
            </CardDescription>
          </div>
          <PresetToggle value={preset} onChange={setPreset} />
        </div>

        {/* Stat cards */}
        {hasData && !loading && (
          <div className="flex gap-3 mt-4 flex-wrap">
            <StatCard
              icon={Droplet}
              label="Último nível"
              value={stats.lastNivel ? `${stats.lastNivel.nivelAgua!.toFixed(1)}` : "—"}
              unit="cm"
              sub={stats.lastNivel ? `em ${stats.lastNivel.dateStr}` : "sem dados"}
              color="hsl(217,91%,60%)"
            />
            <StatCard
              icon={Eye}
              label="Último Secchi"
              value={stats.lastSecchi ? `${stats.lastSecchi.secchi!.toFixed(2)}` : "—"}
              unit="m"
              sub={stats.lastSecchi ? secchiLabel(stats.lastSecchi.secchi) : "sem dados"}
              color={secchiColor(stats.lastSecchi?.secchi ?? null)}
            />
            <StatCard
              icon={CloudRain}
              label={`Chuva (${preset} dias)`}
              value={stats.totalChuva.toFixed(0)}
              unit="mm"
              sub={stats.totalChuva === 0 ? "sem chuva no período" : undefined}
              color="hsl(210,80%,65%)"
            />
            <StatCard
              icon={Clock}
              label="Dias sem chuva"
              value={stats.diasSemChuva !== null ? String(stats.diasSemChuva) : "—"}
              unit={stats.diasSemChuva !== null ? "d" : ""}
              sub={stats.diasSemChuva === 0 ? "chuva hoje" : stats.diasSemChuva !== null ? `última em ${stats.lastChuva?.dateStr}` : undefined}
              color={stats.diasSemChuva !== null && stats.diasSemChuva > 7 ? "#22c55e" : "hsl(var(--muted-foreground))"}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-6 pt-2">
        {loading ? (
          <div className="h-[340px] flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Carregando…
            </div>
          </div>
        ) : error ? (
          <div className="h-[340px] flex items-center justify-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : !hasData ? (
          <div className="h-[340px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum dado disponível para o período</p>
          </div>
        ) : (
          <div className="space-y-2">
            <PainelChuva   data={data} preset={preset} />
            <PainelNivel   data={data} preset={preset} />
            <PainelSecchi  data={data} preset={preset} />

            {/* Legenda de Secchi */}
            <div className="flex items-center justify-center gap-4 pt-1 flex-wrap">
              {[
                { color: "#ef4444", label: "< 0,5 m — Turva"     },
                { color: "#f97316", label: "0,5–1,5 m — Moderada" },
                { color: "#22c55e", label: "1,5–3 m — Boa"        },
                { color: "#06b6d4", label: "> 3 m — Excelente"    },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: color, opacity: 0.85 }} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <p className="text-center text-[10px] text-muted-foreground/50 pt-1">
              Passe o mouse nos gráficos — os 3 painéis sincronizam na mesma data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
