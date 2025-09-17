import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    color: string
    name: string
    payload: any // Dados originais do ponto do gráfico
  }>
  label?: string
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="text-white font-medium mb-2">
        {format(parseISO(data.originalDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300 text-sm">{entry.name}:</span>
            </div>
            <span className="text-white font-medium">
              {typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}
              {entry.dataKey === "chuva" && " mm"}
              {entry.dataKey.includes("turbidez") && " NTU"}
              {entry.dataKey === "secchiVert" && " m"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
