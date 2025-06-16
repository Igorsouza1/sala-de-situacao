"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

interface TableListProps {
  tables: string[]
  selectedTable: string | null
  onSelectTable: (tableName: string) => void
}

export function TableList({ tables, selectedTable, onSelectTable }: TableListProps) {
  if (tables.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma tabela encontrada.</p>
  }
  return (
    <div className="space-y-2">
      {tables.map((table) => (
        <Card
          key={table}
          className={`cursor-pointer hover:bg-muted/80 transition-colors ${selectedTable === table ? "bg-muted border-primary" : "bg-card"}`}
          onClick={() => onSelectTable(table)}
        >
          <CardHeader className="flex flex-row items-center space-x-3 p-3">
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${selectedTable === table ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              <Database className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-medium truncate">{table}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
