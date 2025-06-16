"use client"

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
      <div className="text-center py-12 h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum dado disponível</h3>
        <p className="text-gray-500 text-sm">Tente ajustar sua pesquisa/filtros ou selecione uma tabela diferente.</p>
      </div>
    )
  }

  const columns = Object.keys(data[0] || {})

  if (columns.length === 0) {
    return (
      <div className="text-center py-12 h-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium text-gray-900">Nenhuma coluna disponível</h3>
        <p className="text-gray-500 text-sm">Os dados desta tabela parecem estar vazios ou sem colunas definidas.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white h-full flex flex-col">
      <ScrollArea className="flex-grow">
        <div className="relative">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column}
                    className="font-semibold whitespace-nowrap px-3 py-3 text-xs uppercase tracking-wider"
                  >
                    {column}
                  </TableHead>
                ))}
                <TableHead className="sticky right-0 bg-white z-20 w-[100px] text-right px-3 py-3 text-xs uppercase tracking-wider">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => (
                <TableRow key={item.id || index} className="hover:bg-muted/50 transition-colors">
                  {columns.map((column) => (
                    <TableCell
                      className="max-w-xs truncate px-3 py-2 text-sm"
                      key={column}
                      title={String(item[column])}
                    >
                      {item[column] === null || item[column] === undefined ? (
                        <span className="text-muted-foreground italic">N/A</span>
                      ) : (
                        String(item[column])
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 bg-white z-10 w-[100px] border-l">
                    {" "}
                    {/* Ensure background matches row hover */}
                    <div className="flex justify-end space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(item)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive/90"
                        title="Deletar"
                      >
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
