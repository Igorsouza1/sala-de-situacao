"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Layout principal para gráficos com card e painel lateral
interface ChartLayoutProps {
  title: string
  children: ReactNode
  sidebar?: ReactNode
  statusBadge?: ReactNode
  className?: string
}

export function ChartLayout({ 
  title, 
  children, 
  sidebar, 
  statusBadge, 
  className = "" 
}: ChartLayoutProps) {
  return (
    <div className={`flex gap-4 w-full ${className}`}>
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm flex-1 min-w-0">
        <CardHeader className="pb-4">
          <CardTitle className="text-white flex items-center justify-between">
            <span>{title}</span>
            {statusBadge}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
      
      {sidebar && (
        <div className="flex-shrink-0">
          {sidebar}
        </div>
      )}
    </div>
  )
}

// Filtro de período (7d, 15d, 30d)
interface PeriodOption {
  label: string
  value: number
}

interface ChartPeriodFilterProps {
  value: number
  onValueChange: (value: number) => void
  options: PeriodOption[]
  className?: string
}

export function ChartPeriodFilter({ value, onValueChange, options, className }: ChartPeriodFilterProps) {
  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "default" : "outline"}
          onClick={() => onValueChange(option.value)}
          className={
            value === option.value
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

// Badge para status de dados desatualizados
interface ChartStatusBadgeProps {
  lastUpdate: string
  daysOutdated: number
  className?: string
}

export function ChartStatusBadge({ lastUpdate, daysOutdated, className }: ChartStatusBadgeProps) {
  if (daysOutdated <= 0) return null

  return (
    <Badge variant="outline" className={`border-amber-500 text-amber-400 bg-amber-500/10 ${className}`}>
      Última leitura: {lastUpdate} ({daysOutdated} d)
    </Badge>
  )
}

// Painel lateral com informações explicativas
interface InfoItem {
  label: string
  range: string
  color: string
  description?: string
}

interface ChartInfoPanelProps {
  title: string
  items: InfoItem[]
  className?: string
}

export function ChartInfoPanel({ title, items, className }: ChartInfoPanelProps) {
  return (
    <Card className={`bg-gray-900/50 border-gray-700 backdrop-blur-sm w-56 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        // ** Isso é algo que eu faço muito, mas que não é o ideal.
        // ** o index como key pode levar a alguns bugs de renderização se a lista for reordenada no futuro
        // ** Para termos um padrão vamos tentar seguir a ideia de um valor unico do ITEM
        // ** Vamos tentar usar o KEY do map como outro parametro. Tenta achar um parametro unico do proprio ITEM. 
        //TODO: Escolher outro valor para KEY.
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
            <div
              className="w-4 h-4 rounded border border-gray-600"
              // TODO: Podemos passar esses numeros como parametros e colocar um nome mais descrtivio para eles
              style={{ backgroundColor: item.color.replace("33", "80") }}
            />
            <div className="flex-1">
              <div className="text-white text-sm font-medium">{item.label}</div>
              <div className="text-gray-400 text-xs">{item.range}</div>
            </div>
          </div>
        ))}

        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="text-gray-400 text-xs">
            <p className="mb-1">• Valores baixos indicam água mais clara</p>
            <p>• Valores altos indicam presença de sedimentos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Legenda para gráficos
interface LegendItem {
  color: string
  label: string
}

interface ChartLegendProps {
  items: LegendItem[]
  className?: string
}

export function ChartLegend({ items, className = "" }: ChartLegendProps) {
  return (
    <div className={`flex flex-wrap gap-4 justify-center text-sm ${className}`}>
      // ** Mesma coisa do Chartinfopanel.
      //TODO: Escolher outro valor para KEY.
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-6 h-0.5" style={{ backgroundColor: item.color }} />
          <span className="text-gray-300">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
