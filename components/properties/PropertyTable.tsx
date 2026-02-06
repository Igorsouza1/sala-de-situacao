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
import { Flame, TreePine, AlertCircle, CheckCircle } from "lucide-react"

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

  useEffect(() => {
    async function loadData() {
      if (data) {
        setTableData(data)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const res = await fetch('/api/properties/stats')
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
                        <TableHead className="text-slate-300 font-medium h-12 w-[30%]">Nome</TableHead>
                        <TableHead className="text-slate-300 font-medium h-12 w-[20%]">CAR</TableHead>
                        <TableHead className="text-slate-300 font-medium text-center h-12 w-[10%]">FOCOS</TableHead>
                        <TableHead className="text-slate-300 font-medium text-center h-12 w-[15%]">Desmate (ha)</TableHead>
                        <TableHead className="text-slate-300 font-medium text-center h-12 w-[12%] py-2">
                             <div className="flex flex-col items-center leading-none gap-1">
                                <span>Ações</span>
                                <span className="text-[10px] text-slate-400 font-normal">(Passivos)</span>
                             </div>
                        </TableHead>
                         <TableHead className="text-slate-300 font-medium text-center h-12 w-[12%] py-2">
                             <div className="flex flex-col items-center leading-none gap-1">
                                <span>Ações</span>
                                <span className="text-[10px] text-slate-400 font-normal">(Ativos)</span>
                             </div>
                         </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tableData.map((item, index) => (
                        <TableRow 
                            key={item.id} 
                            className={`
                                border-slate-800/50 transition-colors
                                ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}
                                hover:bg-slate-800/40
                            `}
                        >
                            <TableCell className="font-medium text-slate-200 py-3">{item.name}</TableCell>
                            <TableCell className="text-slate-400 text-xs font-mono py-3" title={item.car}>
                                {formatCar(item.car)}
                            </TableCell>
                            
                            {/* Focos */}
                            <TableCell className="text-center py-3">
                                {item.focos > 0 ? (
                                    <Badge variant="outline" className="bg-red-950/40 border-red-500/30 text-red-400 hover:bg-red-950/60 gap-1 pl-1.5 font-normal">
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
                                    <Badge variant="secondary" className="bg-orange-900/30 text-orange-300 border border-orange-500/20 hover:bg-orange-900/50 gap-1 pl-1.5 font-normal">
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
                                    <Badge variant="secondary" className="bg-emerald-900/30 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-900/50 gap-1 pl-1.5 font-normal">
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
