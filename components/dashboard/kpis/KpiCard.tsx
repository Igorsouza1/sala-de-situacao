"use client"

import { useState } from "react"
import { ArrowUp, ArrowDown, Minus, HelpCircle } from "lucide-react"

export type KpiColorScheme = "danger" | "warning" | "success" | "info"
export type KpiTrend = "alta" | "baixa" | "estavel"
export type KpiTrendSemantic = "negativo" | "neutro"

interface KpiCardProps {
  title: string
  icon: React.ElementType
  value: string | number | null
  unit?: string
  trend: KpiTrend
  trendSemantic?: KpiTrendSemantic
  trendLabel?: string
  sparklineData?: number[]
  tooltip?: string
  colorScheme: KpiColorScheme
  loading?: boolean
}

const colorMap: Record<KpiColorScheme, { icon: string; spark: string; accent: string }> = {
  danger:  { icon: "bg-red-500/15 border-red-500/30 text-red-500",     spark: "#dc3545", accent: "bg-red-500"     },
  warning: { icon: "bg-yellow-500/15 border-yellow-500/30 text-yellow-500", spark: "#ffc107", accent: "bg-yellow-500" },
  success: { icon: "bg-emerald-500/15 border-emerald-500/30 text-emerald-500", spark: "#28a745", accent: "bg-emerald-500" },
  info:    { icon: "bg-blue-500/15 border-blue-500/30 text-blue-500",   spark: "#0d6efd", accent: "bg-blue-500"   },
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const H = 28

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = H - ((v - min) / range) * (H - 6) - 3
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 100 ${H}`}
      preserveAspectRatio="none"
      className="w-full"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={points}
      />
    </svg>
  )
}

function SkeletonKpiCard() {
  return (
    <div className="h-44 bg-card border border-border rounded-xl overflow-hidden animate-pulse flex flex-col">
      <div className="h-1 w-full bg-muted flex-none" />
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex justify-between items-center">
          <div className="w-8 h-8 rounded-lg bg-muted" />
          <div className="w-4 h-4 rounded bg-muted" />
        </div>
        <div className="w-24 h-3 bg-muted rounded" />
        <div className="w-16 h-7 bg-muted rounded" />
        <div className="w-32 h-2.5 bg-muted rounded" />
        <div className="flex-1" />
        <div className="w-full h-7 bg-muted rounded" />
      </div>
    </div>
  )
}

function fmtValue(v: string | number | null): string {
  if (v === null || v === undefined) return "--"
  if (typeof v === "string") return v
  if (!Number.isFinite(v)) return "--"
  return v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
}

export function KpiCard({
  title,
  icon: Icon,
  value,
  unit = "",
  trend,
  trendSemantic = "neutro",
  trendLabel,
  sparklineData,
  tooltip,
  colorScheme,
  loading = false,
}: KpiCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const colors = colorMap[colorScheme]

  if (loading) return <SkeletonKpiCard />

  const TrendIcon = trend === "alta" ? ArrowUp : trend === "baixa" ? ArrowDown : Minus

  const trendColor =
    trendSemantic === "neutro"
      ? "text-muted-foreground"
      : trend === "alta"
      ? "text-red-400"
      : trend === "baixa"
      ? "text-emerald-400"
      : "text-yellow-400"

  return (
    <div className="h-44 bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      {/* Colored accent bar — the semantic signal at a glance */}
      <div className={`h-1 w-full flex-none ${colors.accent}`} />

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4 min-h-0">

        {/* Row: icon + trend arrow + tooltip */}
        <div className="flex items-center justify-between mb-2 flex-none">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colors.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
            {tooltip && (
              <div className="relative">
                <HelpCircle
                  className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                />
                {showTooltip && (
                  <div className="absolute right-0 top-5 z-50 w-56 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg leading-relaxed">
                    {tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title — single line, never wraps */}
        <p className="text-xs font-medium text-muted-foreground truncate flex-none mb-0.5">{title}</p>

        {/* Big Number */}
        <div className="flex items-baseline gap-1 flex-none">
          <span className="text-2xl font-semibold text-foreground tracking-tight leading-none">
            {fmtValue(value)}
          </span>
          {unit && <span className="text-xs text-muted-foreground leading-none">{unit}</span>}
        </div>

        {/* Trend label — always rendered to keep height stable */}
        <p className={`text-xs mt-0.5 flex-none truncate ${trendColor}`}>
          {trendLabel ?? "\u00A0"}
        </p>

        {/* Sparkline — fills remaining space, anchored to bottom */}
        <div className="flex-1 flex items-end mt-1 min-h-0">
          {sparklineData && sparklineData.length > 1 ? (
            <Sparkline data={sparklineData} color={colors.spark} />
          ) : (
            <div className="h-7 w-full" />
          )}
        </div>

      </div>
    </div>
  )
}
