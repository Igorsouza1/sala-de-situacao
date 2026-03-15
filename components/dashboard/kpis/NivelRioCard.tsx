import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { type KpiTrend } from "./KpiCard"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface NivelRioCardProps {
  titulo: string
  icone: React.ElementType
  valor: number | null
  dataRegistro: string | Date | null
  tendencia30Dias: KpiTrend
  loading?: boolean
}

export function NivelRioCard({
  titulo,
  icone: Icon,
  valor,
  dataRegistro,
  tendencia30Dias,
  loading = false,
}: NivelRioCardProps) {
  if (loading) {
    return (
      <div className="h-44 bg-card border border-border rounded-xl p-5 flex flex-col justify-between animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted" />
          <div className="h-5 w-32 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-10 w-24 bg-muted rounded" />
          <div className="h-4 w-40 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const dataFormatada = dataRegistro
    ? format(new Date(dataRegistro), "dd 'de' MMMM, yyyy", { locale: ptBR })
    : "--/--/----"

  const TrendIcon =
    tendencia30Dias === "alta"
      ? ArrowUp
      : tendencia30Dias === "baixa"
      ? ArrowDown
      : Minus

  const trendColor =
    tendencia30Dias === "alta"
      ? "text-red-500 bg-red-500/10"
      : tendencia30Dias === "baixa"
      ? "text-emerald-500 bg-emerald-500/10"
      : "text-blue-500 bg-blue-500/10"

  const trendText =
    tendencia30Dias === "alta"
      ? "Tendência de Alta"
      : tendencia30Dias === "baixa"
      ? "Tendência de Baixa"
      : "Tendência Estável"

  return (
    <div className="h-44 bg-card border border-border shadow-sm rounded-xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Decoração de fundo sutil */}
      <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-foreground/80 text-sm">{titulo}</h3>
        </div>
        
        {/* Badge de tendência visual */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border border-transparent ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span className="hidden sm:inline-block">{trendText} (30 dias)</span>
        </div>
      </div>

      <div className="relative z-10 space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tracking-tight text-foreground">
            {valor !== null ? Number(valor).toFixed(2) : "--"}
          </span>
          <span className="text-lg font-medium text-muted-foreground">m</span>
        </div>
        
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
          Registrado em: <span className="font-medium text-foreground/70">{dataFormatada}</span>
        </p>
      </div>
    </div>
  )
}
