"use client"

import { Card, CardContent } from "@/components/ui/card"

// Estados de carregamento, erro e vazio para gráficos
interface ChartLoadingStateProps {
  className?: string
  height?: string
}

// ** Aqui ficou excelente, simples, limpo e facil.
// ** Unico detalhe é que as tipagens são iguais, podemos fazer apenas 1 delas.
// TODO: Fazer apenas 1 tipagem.

export function ChartLoadingState({ className = "", height = "h-64" }: ChartLoadingStateProps) {
  return (
    <Card className={`bg-gray-900/50 border-gray-700 ${className}`}>
      <CardContent className={`flex items-center justify-center ${height}`}>
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Carregando dados…
        </div>
      </CardContent>
    </Card>
  )
}

interface ChartErrorStateProps {
  error: string
  className?: string
  height?: string
}

export function ChartErrorState({ error, className = "", height = "h-64" }: ChartErrorStateProps) {
  return (
    <Card className={`bg-red-900/20 border-red-700 ${className}`}>
      <CardContent className={`flex items-center justify-center ${height}`}>
        <p className="text-red-400">Erro ao carregar dados: {error}</p>
      </CardContent>
    </Card>
  )
}

interface ChartEmptyStateProps {
  message?: string
  className?: string
  height?: string
}

export function ChartEmptyState({ 
  message = "Nenhum dado disponível", 
  className = "", 
  height = "h-64" 
}: ChartEmptyStateProps) {
  return (
    <Card className={`bg-gray-900/50 border-gray-700 ${className}`}>
      <CardContent className={`flex items-center justify-center ${height}`}>
        <p className="text-gray-400">{message}</p>
      </CardContent>
    </Card>
  )
}
