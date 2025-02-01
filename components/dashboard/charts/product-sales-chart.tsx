"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

const data = {
  all: [
    { name: "Produto A", value: 400 },
    { name: "Produto B", value: 300 },
    { name: "Produto C", value: 200 },
    { name: "Produto D", value: 100 },
  ],
  "2023": [
    { name: "Produto A", value: 450 },
    { name: "Produto B", value: 350 },
    { name: "Produto C", value: 250 },
    { name: "Produto D", value: 150 },
  ],
  // Adicione dados para outros anos aqui
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

interface ProductSalesChartProps {
  selectedYear: string
}

export function ProductSalesChart({ selectedYear }: ProductSalesChartProps) {
  const chartData = data[selectedYear as keyof typeof data] || data.all

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendas por Produto</CardTitle>
        <CardDescription>Distribuição de vendas por produto</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            sales: {
              label: "Vendas",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

