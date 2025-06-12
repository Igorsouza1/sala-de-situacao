"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ReferenceArea,
} from "recharts"
import { format, parseISO, subDays, differenceInCalendarDays } from "date-fns"
import { useDailyDeque } from "@/context/DailyDequeContext"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"

interface SeriePonto {
  diaFmt: string
  turbidez: number
  originalDate: string
}

export function GraficoTurbidezDiario({ dias = 30 }: { dias?: number }) {
  const { raw, isLoading, error } = useDailyDeque()

  if (isLoading) return <p className="text-white/70">Carregando...</p>
  if (error)     return <p className="text-red-400">{error}</p>
  if (!raw.length) return <p className="text-white/70">Sem dados disponíveis.</p>

  /* -------------------------------------------------- */
  /* Série dos últimos N dias (se houver)               */
  const serieRecentes: SeriePonto[] = raw
    .filter(e => new Date(e.data) >= subDays(new Date(), dias))
    .sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .map(e => ({
      diaFmt: format(parseISO(e.data), "dd/MM"),
      turbidez: e.turbidez,
      originalDate: e.data,
    }))

  /* -------------------------------------------------- */
  /* Se vazia, cria série com o último ponto histórico  */
  let serie: SeriePonto[] = serieRecentes
  let badgeTexto = ""

  if (!serieRecentes.length) {
    const ultimoRegistro = raw.sort(
      (a,b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    )[0]

    serie = [
      {
        diaFmt: format(parseISO(ultimoRegistro.data), "dd/MM"),
        turbidez: ultimoRegistro.turbidez,
        originalDate: ultimoRegistro.data,
      },
    ]

    const diasAtras = differenceInCalendarDays(new Date(), new Date(ultimoRegistro.data))
    badgeTexto = `Última leitura disponível (${diasAtras} dias atrás): ${format(parseISO(ultimoRegistro.data), "dd/MM/yyyy")}`
  }

  const corLinha = "hsl(210 90% 60%)"

  return (
    <div className="space-y-2">
      {badgeTexto && (
        <Badge
          variant="outline"
          className="border-yellow-400 text-yellow-300 bg-yellow-400/10"
        >
          {badgeTexto}
        </Badge>
      )}

      <ChartContainer
        config={{ turbidez: { label: "Turbidez (NTU)", color: corLinha } }}
        className="h-[300px]"
      >
        <ResponsiveContainer height={300}>
  <ComposedChart data={serie}>
    {/* grade */}
    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff33" />

    {/* eixo X */}
    <XAxis dataKey="diaFmt" stroke="#ffffffcc" fontSize={12} />

    {/* eixo Y turbidez */}
    <YAxis
      yAxisId="turb"
      stroke="#60a5fa"
      domain={[0, 'dataMax + 0.5']}
      tickFormatter={(v) => v.toFixed(1)}
    />

    {/* eixo Y secchi */}
    <YAxis
      yAxisId="secchi"
      orientation="right"
      stroke="#fbbf24"
      domain={[0, 'dataMax + 1']}
      tickFormatter={(v) => v.toFixed(1)}
    />

    {/* barras de chuva */}
    <Bar
      dataKey="chuva"
      yAxisId="turb"
      fill="#38bdf820"
      stroke="#38bdf899"
      barSize={6}
    />

    {/* faixa‐alvo */}
    <ReferenceArea   yAxisId="turb" y1={0} y2={1} fill="#0f766e33" />

    {/* linha turbidez */}
    <Line
      yAxisId="turb"
      dataKey="turbidez"
      stroke="#60a5fa"
      strokeWidth={2}
      dot={false}
    />

    {/* média móvel */}
    <Line
      yAxisId="turb"
      dataKey="turbidezMedia7d"
      stroke="#1d4ed8"
      strokeDasharray="5 3"
      dot={false}
    />

    {/* linha Secchi vertical */}
    <Line
      yAxisId="secchi"
      dataKey="secchiVert"
      stroke="#fbbf24"
      strokeWidth={2}
      dot={false}
    />

    {/* tooltip */}
    <Tooltip content={<ChartTooltipContent />} />
  </ComposedChart>
</ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
