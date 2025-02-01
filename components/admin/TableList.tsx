import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Database } from "lucide-react"

interface TableListProps {
  tables: string[]
  onSelectTable: (tableName: string) => void
}

export function TableList({ tables, onSelectTable }: TableListProps) {
  return (
    <>
      {tables.map((table) => (
        <Card
          key={table}
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => onSelectTable(table)}
        >
          <CardHeader className="flex flex-row items-center space-x-4 p-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-base font-medium truncate">{table}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </>
  )
}

