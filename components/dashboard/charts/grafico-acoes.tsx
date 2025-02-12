"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AcaoData {
  acao: string
  valor: number
}

// Cores ajustadas para o tema do projeto
const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--pantaneiro-green))",
  "hsl(var(--pantaneiro-lime))",
]

export function GraficoAcoes() {
  const [data, setData] = useState<AcaoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/dashboard/acoes")
        if (!response.ok) {
          throw new Error("Falha ao buscar dados")
        }
        const result = await response.json()

        // Remove "Ponto de Referência"
        const filteredData = result.filter((item: AcaoData) => item.acao !== "Ponto de Referência")

        setData(filteredData)
      } catch (error) {
        console.error("Erro ao buscar dados de ações:", error)
        setError("Falha ao carregar dados. Por favor, tente novamente mais tarde.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
          <p className="text-muted-foreground">Carregando...</p>
    )
  }

  if (error) {
    return (
          <p className="text-destructive">{error}</p>
    )
  }

  if (!data || data.length === 0) {
    return (
          <p className="text-muted-foreground">Nenhum dado encontrado</p>
    )
  }

  const total = data.reduce((sum, item) => sum + item.valor, 0)
  const pieData = data.map((item) => ({
    ...item,
    percentage: (item.valor / total) * 100,
  }))

  return (
    <Card className="w-full h-[400px] bg-white/10 border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-semibold text-primary">Distribuição de Ações</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="percentage"
              nameKey="acao"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-popover text-popover-foreground p-2 rounded-md shadow-md">
                      <p className="font-semibold">{data.acao}</p>
                      <p>Quantidade: {data.valor}</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm font-medium shad" style={{
                  color: entry.color,
                  textShadow: "-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff",
                }}
              >
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

