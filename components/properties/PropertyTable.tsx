"use client"

import { useState, useEffect } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Flame, TreePine, AlertCircle, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Copy } from "lucide-react"

export interface PropertySummary {
  id: string
  name: string
  car: string // Cadastro Ambiental Rural
  focos: number
  desmatamentoHa: number
  acoesPassivos: number
  acoesAtivos: number
}

interface PropertyTableProps {
  data?: PropertySummary[]
}

const formatCar = (car: string) => {
  if (car.length > 15) {
    return `${car.substring(0, 8)}...${car.substring(car.length - 4)}`
  }
  return car
}

export function PropertyTable({ data }: PropertyTableProps) {
  const [tableData, setTableData] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof PropertySummary
    direction: "asc" | "desc"
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      if (data) {
        setTableData(data)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await fetch("/api/properties/stats")
        const json = await res.json()
        if (json.success) {
          setTableData(json.data)
        }
      } catch (error) {
        console.error("Failed to fetch property data", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [data])

  const handleSort = (key: keyof PropertySummary) => {
    let direction: "asc" | "desc" = "desc" // default to desc for metrics

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc"
    }
    setSortConfig({ key, direction })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    // Could add visual feedback here
  }

  const sortedData = [...tableData].sort((a, b) => {
    if (!sortConfig) return 0

    const { key, direction } = sortConfig
    
    // Handle string comparisons for name/car
    if (key === 'name' || key === 'car') {
        const valA = (a[key] || '').toLowerCase()
        const valB = (b[key] || '').toLowerCase()
        if (valA < valB) return direction === 'asc' ? -1 : 1
        if (valA > valB) return direction === 'asc' ? 1 : -1
        return 0
    }

    // Handle numeric comparisons
    const valA =  Number(a[key]) || 0
    const valB = Number(b[key]) || 0

    if (valA < valB) return direction === "asc" ? -1 : 1
    if (valA > valB) return direction === "asc" ? 1 : -1
    return 0
  })

  const SortIcon = ({ column }: { column: keyof PropertySummary }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown className="ml-2 h-3.5 w-3.5 text-slate-500/50" />
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-3.5 w-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="ml-2 h-3.5 w-3.5 text-blue-400" />
    )
  }

  return (
    <Card className="w-full bg-brand-dark-blue border-slate-800 text-slate-100 shadow-xl overflow-hidden">
      <CardHeader className="bg-slate-900/30 border-b border-slate-800/50 py-4">
        <CardTitle className="text-lg font-semibold text-blue-100 flex items-center gap-2">
          Resumo de Propriedades e Monitoramento
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] w-full">
          <Table>
            <TableHeader className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
              <TableRow className="hover:bg-slate-900/80 border-slate-700/50">
                <TableHead
                  className="text-slate-300 font-medium h-12 w-[40%] cursor-pointer hover:text-white transition-colors"
                >
                  CAR
                </TableHead>
                <TableHead
                  className="text-slate-300 font-medium text-center h-12 w-[15%] cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("focos")}
                >
                  <div className="flex items-center justify-center">
                    FOCOS
                    <SortIcon column="focos" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-300 font-medium text-center h-12 w-[15%] cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("desmatamentoHa")}
                >
                  <div className="flex items-center justify-center">
                    Desmate (ha)
                    <SortIcon column="desmatamentoHa" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-300 font-medium text-center h-12 w-[15%] py-2 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("acoesPassivos")}
                >
                  <div className="flex flex-col items-center leading-none gap-1">
                    <div className="flex items-center">
                      Ações
                      <SortIcon column="acoesPassivos" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Passivos)
                    </span>
                  </div>
                </TableHead>
                <TableHead
                  className="text-slate-300 font-medium text-center h-12 w-[15%] py-2 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort("acoesAtivos")}
                >
                  <div className="flex flex-col items-center leading-none gap-1">
                    <div className="flex items-center">
                      Ações
                      <SortIcon column="acoesAtivos" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Ativos)
                    </span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={`
                                border-slate-800/50 transition-colors
                                ${index % 2 === 0 ? "bg-transparent" : "bg-slate-900/20"}
                                hover:bg-slate-800/40
                            `}
                >
                  <TableCell
                    className="text-slate-300 text-sm font-mono py-3 font-medium text-center sm:text-left pl-4"
                    title={item.car}
                  >
                    <div className="flex items-center gap-2 group">
                        {formatCar(item.car)}
                        <button 
                            onClick={() => handleCopy(item.car)}
                            className="p-1.5 rounded-md hover:bg-slate-700/50 text-slate-500 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Copiar CAR"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </button>
                    </div>
                  </TableCell>

                  {/* Focos */}
                  <TableCell className="text-center py-3">
                    {item.focos > 0 ? (
                      <Badge
                        variant="outline"
                        className="bg-red-950/40 border-red-500/30 text-red-400 hover:bg-red-950/60 gap-1 pl-1.5 font-normal"
                      >
                        <Flame className="w-3 h-3 fill-red-400/20" />
                        {item.focos}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 text-sm">-</span>
                    )}
                  </TableCell>

                  {/* Desmatamento */}
                  <TableCell className="text-center py-3">
                    {item.desmatamentoHa > 0 ? (
                      <div className="flex items-center justify-center gap-1.5 text-amber-400 font-medium text-sm">
                        <TreePine className="w-3.5 h-3.5" />
                        {item.desmatamentoHa.toFixed(1)}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-sm">-</span>
                    )}
                  </TableCell>

                  {/* Ações Passivas */}
                  <TableCell className="text-center py-3">
                    {item.acoesPassivos > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-orange-900/30 text-orange-300 border border-orange-500/20 hover:bg-orange-900/50 gap-1 pl-1.5 font-normal"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {item.acoesPassivos}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 text-sm">-</span>
                    )}
                  </TableCell>

                  {/* Ações Ativas */}
                  <TableCell className="text-center py-3">
                    {item.acoesAtivos > 0 ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-900/30 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-900/50 gap-1 pl-1.5 font-normal"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {item.acoesAtivos}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
