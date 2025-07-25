"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Plus, X, Upload } from "lucide-react"
import { DataTable } from "./data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CsvUploadModal } from "@/components/admin/shared/csv-upload.modal"
import { GeoJsonUploadModal } from "@/components/admin/shared/geojson-upload-modal"
import { XlsxUploadModal } from "@/components/admin/shared/xlsx-upload-modal"
import { AddItemModal } from "@/components/admin/shared/add-item-modal"
import { EditItemModal } from "@/components/admin/shared/edit-item-modal"
import { DeleteConfirmationModal } from "@/components/admin/shared/delete-confirmation-modal"
import { FilterModal } from "./filter-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Database } from "lucide-react"

interface FilterState {
  column: string
  operator: string
  value: string
}

const EDITABLE_TABLES = new Set(["Ações", "Deque de pedras", "Estradas", "Ponte do cure", "Propriedades", "Waypoints"])

export function DataManager() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isGeoJsonModalOpen, setIsGeoJsonModalOpen] = useState(false)
  const [isXlsxModalOpen, setIsXlsxModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingItem, setDeletingItem] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<FilterState[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
      setActiveFilters([])
      setSearchQuery("")
    } else {
      setTableData([])
      setActiveFilters([])
      setSearchQuery("")
    }
  }, [selectedTable])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/admin/tables")
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const allTables = await response.json()
      const filteredTables = allTables.filter((table: string) => EDITABLE_TABLES.has(table))
      setTables(filteredTables)
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast({
        title: "Erro",
        description: "Falha ao buscar tabelas.",
        variant: "destructive",
      })
    }
  }

  const fetchTableData = async (tableName: string) => {
    try {
      const response = await fetch(`/api/admin/table-data?table=${tableName}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      setTableData(data)
    } catch (error) {
      console.error(`Error fetching data for table ${tableName}:`, error)
      toast({
        title: "Erro",
        description: `Falha ao buscar dados para a tabela ${tableName}.`,
        variant: "destructive",
      })
    }
  }

  const handleAddItem = async (item: any) => {
    if (!selectedTable) return
    try {
      const response = await fetch(`/api/admin/add-item?table=${selectedTable}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      await fetchTableData(selectedTable)
      setIsAddItemModalOpen(false)
      toast({ title: "Sucesso", description: "Item adicionado com sucesso." })
    } catch (error) {
      console.error("Error adding item:", error)
      toast({ title: "Erro", description: "Falha ao adicionar item.", variant: "destructive" })
    }
  }

  const confirmDeleteItem = async () => {
    if (!deletingItem || !selectedTable) return
    try {
      const response = await fetch(`/api/admin/delete-item?table=${selectedTable}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deletingItem),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      await fetchTableData(selectedTable)
      setIsDeleteModalOpen(false)
      setDeletingItem(null)
      toast({ title: "Sucesso", description: "Item deletado com sucesso." })
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({ title: "Erro", description: "Falha ao deletar item.", variant: "destructive" })
    }
  }

  const handleSaveEdit = async (editedItem: any) => {
    if (!selectedTable) return
    try {
      const response = await fetch(`/api/admin/update-item?table=${selectedTable}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedItem),
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      await fetchTableData(selectedTable)
      setIsEditModalOpen(false)
      setEditingItem(null)
      toast({ title: "Sucesso", description: "Item atualizado com sucesso." })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({ title: "Erro", description: "Falha ao atualizar item.", variant: "destructive" })
    }
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setIsEditModalOpen(true)
  }

  const handleDeleteItem = (item: any) => {
    setDeletingItem(item)
    setIsDeleteModalOpen(true)
  }

  const handleApplyFilters = (newFilters: FilterState[]) => {
    setActiveFilters(newFilters)
    setIsFilterModalOpen(false)
  }

  const filteredData = useMemo(() => {
    let data = tableData
    if (searchQuery) {
      data = data.filter((item) =>
        Object.values(item).some(
          (value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    }
    if (activeFilters.length > 0) {
      data = data.filter((item) => {
        return activeFilters.every((filter) => {
          const itemValue = item[filter.column]
          const filterValue = filter.value
          if (itemValue === null || itemValue === undefined) return false
          const itemValueStr = String(itemValue).toLowerCase()
          const filterValueStr = String(filterValue).toLowerCase()
          const numericItemValue = Number.parseFloat(String(itemValue))
          const numericFilterValue = Number.parseFloat(String(filterValue))
          const canCompareNumerically = !isNaN(numericItemValue) && !isNaN(numericFilterValue)
          switch (filter.operator) {
            case "equals":
              return itemValueStr === filterValueStr
            case "contains":
              return itemValueStr.includes(filterValueStr)
            case "startsWith":
              return itemValueStr.startsWith(filterValueStr)
            case "endsWith":
              return itemValueStr.endsWith(filterValueStr)
            case "notEquals":
              return itemValueStr !== filterValueStr
            case "greaterThan":
              return canCompareNumerically ? numericItemValue > numericFilterValue : itemValueStr > filterValueStr
            case "lessThan":
              return canCompareNumerically ? numericItemValue < numericFilterValue : itemValueStr < filterValueStr
            case "greaterThanOrEqual":
              return canCompareNumerically ? numericItemValue >= numericFilterValue : itemValueStr >= filterValueStr
            case "lessThanOrEqual":
              return canCompareNumerically ? numericItemValue <= numericFilterValue : itemValueStr <= filterValueStr
            default:
              return true
          }
        })
      })
    }
    return data
  }, [tableData, searchQuery, activeFilters])

  const tableColumns = useMemo(() => (tableData.length > 0 ? Object.keys(tableData[0]) : []), [tableData])

  return (
    <div className="h-full p-4 md:p-8 flex flex-col">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gerenciamento de Dados</h1>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!selectedTable} className="bg-white">
                <Upload className="h-4 w-4 mr-2" />
                Upload de Arquivo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsXlsxModalOpen(true)}>Upload XLSX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCsvModalOpen(true)}>Upload CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsGeoJsonModalOpen(true)}>Upload GeoJSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setIsAddItemModalOpen(true)}
            disabled={!selectedTable}
            className="bg-pantaneiro-lime text-primary-dark hover:bg-pantaneiro-lime-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 flex-grow overflow-hidden flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          <Select onValueChange={setSelectedTable} value={selectedTable || ""}>
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue placeholder="Selecione uma tabela" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Tabelas Editáveis</SelectLabel>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar na tabela..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
              disabled={!selectedTable}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsFilterModalOpen(true)}
            disabled={!selectedTable}
            className="bg-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {activeFilters.length > 0 && (
          <div className="mb-4 p-3 bg-pantaneiro-lime/20 border border-pantaneiro-lime/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm text-pantaneiro-green">Filtros Ativos:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilters([])}
                className="text-pantaneiro-green hover:text-pantaneiro-green/80"
              >
                Limpar Todos
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2 rounded-full bg-pantaneiro-lime/30 text-pantaneiro-green"
                >
                  {filter.column} {filter.operator} "{filter.value}"
                  <button
                    className="ml-1 hover:bg-pantaneiro-lime/40 rounded-full p-0.5"
                    onClick={() => setActiveFilters((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {selectedTable ? (
          <div className="flex-grow overflow-hidden -mr-6 -ml-6">
            <DataTable data={filteredData} onEdit={handleEditItem} onDelete={handleDeleteItem} />
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Bem-vindo</h3>
              <p className="mt-1 text-sm text-gray-500">Selecione uma tabela para começar a gerenciar os dados.</p>
            </div>
          </div>
        )}
      </div>

      <XlsxUploadModal
        isOpen={isXlsxModalOpen}
        onClose={() => setIsXlsxModalOpen(false)}
        onUpload={(data) => console.log("XLSX data:", data)}
      />
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onUpload={(data) => console.log("CSV data:", data)}
      />
      <GeoJsonUploadModal
        isOpen={isGeoJsonModalOpen}
        onClose={() => setIsGeoJsonModalOpen(false)}
        onUpload={(data) => console.log("GeoJSON data:", data)}
      />
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAdd={handleAddItem}
        table={selectedTable}
      />
      <EditItemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEdit}
        item={editingItem}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteItem}
        itemName={deletingItem ? String(Object.values(deletingItem)[1] ?? Object.values(deletingItem)[0] ?? "") : ""}
      />
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        columns={tableColumns}
        onApplyFilters={handleApplyFilters}
        currentFilters={activeFilters}
      />
    </div>
  )
}
