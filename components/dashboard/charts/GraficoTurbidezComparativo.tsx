"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { format, parseISO, differenceInCalendarDays } from "date-fns"
import { useDailyDeque } from "@/context/DailyDequeContext"
import { 
  ChartContainer, 
  ChartTooltipContent,
  ChartPeriodFilter,
  ChartInfoPanel,
  ChartStatusBadge,
  ChartLoadingState,
  ChartErrorState,
  ChartEmptyState,
  ChartLegend,
  ChartLayout
} from "@/components/ui/chart-components"

// Constantes reutilizáveis
const PERIOD_OPTIONS = [
  { label: "7 d", value: 7 },
  { label: "15 d", value: 15 },
  { label: "30 d", value: 30 },
]

const TURBIDEZ_BANDS = [
  { label: "Flutuação excelente", range: "0–3 NTU", color: "#10b98133" },
  { label: "Boa – atenção", range: "4–7 NTU", color: "#eab30833" },
  { label: "Regular – informe", range: "8–15 NTU", color: "#f9731633" },
  { label: "Experiência ruim", range: ">15 NTU", color: "#ef444433" },
]

const CHART_CONFIGS = {
  turbidez: {
    label: "Turbidez (NTU)",
    color: "#3b82f6",
  },
  secchi: {
    label: "Secchi (m)",
    color: "#f59e0b",
  },
  chuva: {
    label: "Chuva (mm)",
    color: "#06b6d4",
  },
}

export function GraficoTurbidezComparativo() {
  const { raw, isLoading, error } = useDailyDeque()
  const [selectedPeriod, setSelectedPeriod] = useState(30)

    // Processar dados
    // TODO: PODE SER UM HOOK REUTILIZÁVEL -- VAMOS DEIXAR ESSE TODO EM ABERTO, Não precisa executar.
    const processedData = useMemo(() => {
      if (!raw.length) return []

      const sorted = raw.slice().sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      const maxDays = Math.min(selectedPeriod, 30)
      const start = Math.max(0, sorted.length - maxDays)
      const filteredData = sorted.slice(start)

      return filteredData.map((entry) => {

        
        const safe = (v: any, dec = 2) => {
          const n = Number(v)
          return !isFinite(n) ? 0 : Number(n.toFixed(dec))
        }

        return {
          diaFmt: format(parseISO(entry.data), "dd/MM"),
          originalDate: entry.data,
          turbidez: safe(entry.turbidez, 2),
          secchi: safe(entry.secchiVertical, 2),
          chuva: safe(entry.chuva, 1),
        }
      })
  }, [raw, selectedPeriod])

  // Informações de status
  const statusInfo = useMemo(() => {
    if (!raw.length) return null
    const lastEntry = raw[raw.length - 1]
    const dias = differenceInCalendarDays(new Date(), new Date(lastEntry.data))
    return {
      dias,
      dataFmt: format(parseISO(lastEntry.data), "dd/MM/yyyy"),
      outdated: dias > 0
    }
  }, [raw])

  // Estados de loading e error
  if (isLoading) {
    return <ChartLoadingState />
  }

  if (error) {
    return <ChartErrorState error={error} />
  }

  if (!processedData.length) {
    return <ChartEmptyState />
  }

  // Dados da legenda
  const legendItems = [
    { color: "#3b82f6", label: "Turbidez (NTU)" },
    { color: "#f59e0b", label: "Secchi (m)" },
    { color: "#06b6d4", label: "Chuva (mm)" },
  ]

  return (
    <ChartLayout
      title="Monitoramento de Turbidez - Comparativo"
      statusBadge={statusInfo?.outdated ? (
        <ChartStatusBadge 
          lastUpdate={statusInfo.dataFmt} 
          daysOutdated={statusInfo.dias} 
        />
      ) : undefined}
      sidebar={
        <ChartInfoPanel 
          title="Faixas de Turbidez"
          items={TURBIDEZ_BANDS}
        />
      }
    >
          <ChartPeriodFilter
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            options={PERIOD_OPTIONS}
          />

          <ChartContainer
            config={CHART_CONFIGS}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--dashboard-accent))" />
                <XAxis 
                  dataKey="diaFmt" 
                  stroke="hsl(var(--dashboard-muted))" 
                  fontSize={11}
                  tickLine={{ stroke: "hsl(var(--dashboard-accent))" }}
                  axisLine={{ stroke: "hsl(var(--dashboard-accent))" }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="hsl(var(--dashboard-muted))" 
                  fontSize={11}
                  tickLine={{ stroke: "hsl(var(--dashboard-accent))" }}
                  axisLine={{ stroke: "hsl(var(--dashboard-accent))" }}
                />
                <Tooltip 
                  content={<ChartTooltipContent />}
                  contentStyle={{
                    backgroundColor: "hsl(var(--dashboard-card))",
                    border: "1px solid hsl(var(--dashboard-accent))",
                    borderRadius: "8px",
                    color: "hsl(var(--dashboard-text))"
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    color: "hsl(var(--dashboard-text))",
                    fontSize: "12px"
                  }}
                />
                <Bar 
                  dataKey="turbidez" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Turbidez (NTU)"
                />
                <Bar 
                  dataKey="secchi" 
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="Secchi (m)"
                />
                <Bar 
                  dataKey="chuva" 
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  name="Chuva (mm)"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartLegend items={legendItems} />
        </ChartLayout>
  )
}
