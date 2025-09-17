"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Database } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

interface DataTableProps {
  data: any[]
  onEdit: (item: any) => void
  onDelete: (item: any) => void
}

export function DataTable({ data, onEdit, onDelete }: DataTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 h-full flex flex-col items-center justify-center">
        <Database className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum dado encontrado</h3>
        <p className="text-gray-500 text-sm">Tente ajustar sua pesquisa ou filtros.</p>
      </div>
    )
  }

  const columns = Object.keys(data[0] || {})

  return (
    <ScrollArea className="h-full">
      <div className="relative p-6">
        <Table className="border-collapse">
          <TableHeader>
            <TableRow className="border-b-0">
              {columns.map((column) => (
                <TableHead
                  key={column}
                  className="font-semibold whitespace-nowrap px-4 py-4 text-xs uppercase tracking-wider text-gray-500"
                >
                  {column}
                </TableHead>
              ))}
              <TableHead className="sticky right-0 bg-white/80 backdrop-blur-sm w-[100px] text-right px-4 py-4 text-xs uppercase tracking-wider text-gray-500">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id || index} className="border-b hover:bg-pantaneiro-lime/20 transition-colors">
                {columns.map((column) => (
                  <TableCell
                    className="max-w-xs truncate px-4 py-4 text-sm text-gray-700"
                    key={column}
                    title={String(item[column])}
                  >
                    {item[column] === null || item[column] === undefined ? (
                      <span className="text-gray-400 italic">N/A</span>
                    ) : (
                      String(item[column])
                    )}
                  </TableCell>
                ))}
                <TableCell className="sticky right-0 bg-white/80 backdrop-blur-sm w-[100px]">
                  <div className="flex justify-end space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Editar">
                      <Edit className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      className="hover:bg-destructive/10"
                      title="Deletar"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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
  )
}
