"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = {
  all: [
    { month: "Jan", users: 100 },
    { month: "Feb", users: 150 },
    { month: "Mar", users: 200 },
    { month: "Apr", users: 250 },
    { month: "May", users: 300 },
    { month: "Jun", users: 350 },
  ],
  "2023": [
    { month: "Jan", users: 120 },
    { month: "Feb", users: 180 },
    { month: "Mar", users: 220 },
    { month: "Apr", users: 280 },
    { month: "May", users: 320 },
    { month: "Jun", users: 380 },
  ],
  // Adicione dados para outros anos aqui
}

interface UserGrowthChartProps {
  selectedYear: string
}

export function UserGrowthChart({ selectedYear }: UserGrowthChartProps) {
  const chartData = data[selectedYear as keyof typeof data] || data.all

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento de Usuários</CardTitle>
        <CardDescription>Novos usuários por mês</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            users: {
              label: "Usuários",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="users" fill="var(--color-users)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

