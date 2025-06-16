"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Filter, Plus, X } from "lucide-react"
import { DataTable } from "./DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CsvUploadModal } from "./CsvUploadModal"
import { GeoJsonUploadModal } from "./GeojsonUpload"
import { AddItemModal } from "./AddItemModal"
import { EditItemModal } from "./EditItemModal"
import { DeleteConfirmationModal } from "./DeleteConfirmationModal"
import { FilterModal } from "./FilterModa" // Importação do novo modal
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface FilterState {
  column: string
  operator: string
  value: string
}

export function AdminPanel() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isGeoJsonModalOpen, setIsGeoJsonModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false) // Estado para o novo modal
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingItem, setDeletingItem] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState<FilterState[]>([]) // Estado para filtros ativos
  const { toast } = useToast()

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
      setActiveFilters([]) // Limpa filtros ao trocar de tabela
      setSearchQuery("") // Limpa pesquisa ao trocar de tabela
    } else {
      setTableData([])
      setActiveFilters([])
      setSearchQuery("")
    }
  }, [selectedTable])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/admin/tables")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast({
        title: "Erro",
        description: "Falha ao buscar tabelas. Por favor, tente novamente.",
        variant: "destructive",
      })
    }
  }

  const fetchTableData = async (tableName: string) => {
    try {
      const response = await fetch(`/api/admin/table-data?table=${tableName}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTableData(data)
    } catch (error) {
      console.error(`Error fetching data for table ${tableName}:`, error)
      toast({
        title: "Erro",
        description: `Falha ao buscar dados para a tabela ${tableName}. Por favor, tente novamente.`,
        variant: "destructive",
      })
    }
  }

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setIsEditModalOpen(true)
  }

  const handleDeleteItem = (item: any) => {
    setDeletingItem(item)
    setIsDeleteModalOpen(true)
  }

  const handleAddItem = async (item: any) => {
    if (selectedTable) {
      try {
        const response = await fetch(`/api/admin/add-item?table=${selectedTable}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        await fetchTableData(selectedTable)
        setIsAddItemModalOpen(false)
        toast({
          title: "Sucesso",
          description: "Item adicionado com sucesso.",
        })
      } catch (error) {
        console.error("Error adding item:", error)
        toast({
          title: "Erro",
          description: "Falha ao adicionar item. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  const confirmDeleteItem = async () => {
    if (deletingItem && selectedTable) {
      try {
        const response = await fetch(`/api/admin/delete-item?table=${selectedTable}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deletingItem),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        await fetchTableData(selectedTable)
        setIsDeleteModalOpen(false)
        setDeletingItem(null)
        toast({
          title: "Sucesso",
          description: "Item deletado com sucesso.",
        })
      } catch (error) {
        console.error("Error deleting item:", error)
        toast({
          title: "Erro",
          description: "Falha ao deletar item. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveEdit = async (editedItem: any) => {
    if (selectedTable) {
      try {
        const response = await fetch(`/api/admin/update-item?table=${selectedTable}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedItem),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        await fetchTableData(selectedTable)
        setIsEditModalOpen(false)
        setEditingItem(null)
        toast({
          title: "Sucesso",
          description: "Item atualizado com sucesso.",
        })
      } catch (error) {
        console.error("Error updating item:", error)
        toast({
          title: "Erro",
          description: "Falha ao atualizar item. Por favor, tente novamente.",
          variant: "destructive",
        })
      }
    }
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

          if (itemValue === null || itemValue === undefined) {
            if (
              filter.operator === "equals" &&
              (filterValue === null || filterValue === "" || filterValue === undefined)
            )
              return true
            if (
              filter.operator === "notEquals" &&
              filterValue !== null &&
              filterValue !== "" &&
              filterValue !== undefined
            )
              return true
            return false
          }

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

  const tableColumns = useMemo(() => {
    if (tableData.length > 0) {
      return Object.keys(tableData[0])
    }
    return []
  }, [tableData])

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gray-50/90">
      <div className="container mx-auto p-6 h-full flex flex-col">
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-grow overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Gerenciamento de Banco de Dados</h1>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsCsvModalOpen(true)} disabled={!selectedTable}>
                Upload CSV
              </Button>
              <Button variant="outline" onClick={() => setIsGeoJsonModalOpen(true)} disabled={!selectedTable}>
                Upload GeoJSON
              </Button>
              <Button onClick={() => setIsAddItemModalOpen(true)} disabled={!selectedTable}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Item
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <Select onValueChange={handleTableSelect} value={selectedTable || ""}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma tabela" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar itens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={!selectedTable}
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsFilterModalOpen(true)} disabled={!selectedTable}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-blue-700">Filtros Ativos:</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilters([])}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Limpar Todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                    {filter.column} {filter.operator} "{filter.value}"
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 ml-1 hover:bg-blue-200 rounded-full"
                      onClick={() => {
                        setActiveFilters((prev) => prev.filter((_, i) => i !== index))
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {selectedTable ? (
            <div className="flex-grow overflow-hidden">
              <DataTable data={filteredData} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              Selecione uma tabela para visualizar seu conteúdo.
            </div>
          )}
        </div>
      </div>

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onUpload={(data) => {
          console.log("CSV data:", data) // Implementar lógica de upload
          toast({
            title: "Sucesso",
            description: "Dados CSV enviados (implementar lógica).",
          })
        }}
      />
      <GeoJsonUploadModal
        isOpen={isGeoJsonModalOpen}
        onClose={() => setIsGeoJsonModalOpen(false)}
        onUpload={(data) => {
          console.log("GeoJSON data:", data) // Implementar lógica de upload
          toast({
            title: "Sucesso",
            description: "Dados GeoJSON enviados (implementar lógica).",
          })
        }}
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
