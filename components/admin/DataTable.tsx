import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface DataTableProps {
  data: any[]
  onEdit: (item: any) => void
  onDelete: (item: any) => void
}

export function DataTable({ data, onEdit, onDelete }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-1">No data available</h3>
        <p className="text-gray-500">Try adjusting your search or select a different table</p>
      </div>
    )
  }

  const columns = Object.keys(data[0] || {})

  if (columns.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No columns available</h3>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white h-full">
      <ScrollArea className="h-full">
        <div className="relative">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 bg-white z-20 w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell className="max-w-6" key={column}>{item[column]}</TableCell>
                  ))}
                  <TableCell className="sticky right-0 bg-white z-20 w-[100px]">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

