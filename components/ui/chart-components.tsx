// Componentes de gráficos reutilizáveis - Organizados por funcionalidade

// Core do Recharts (container e tooltip)
export { ChartContainer, ChartTooltipContent } from "./chart-core"

// Estados dos gráficos (loading, error, empty)
export { ChartLoadingState, ChartErrorState, ChartEmptyState } from "./chart-states"

// UI dos gráficos (layout, filtros, painéis, legendas, badges)
export { 
  ChartLayout, 
  ChartPeriodFilter, 
  ChartInfoPanel, 
  ChartStatusBadge, 
  ChartLegend 
} from "./chart-ui"
