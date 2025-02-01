"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus } from "lucide-react"
import { DataTable } from "./DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CsvUploadModal } from "./CsvUploadModal"
import { GeoJsonUploadModal } from "./GeojsonUpload"
import { AddItemModal } from "./AddItemModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminPanel() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isGeoJsonModalOpen, setIsGeoJsonModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
    }
  }, [selectedTable])

  const fetchTables = async () => {
    const response = await fetch("/api/admin/tables")
    const data = await response.json()
    setTables(data)
  }

  const fetchTableData = async (tableName: string) => {
    const response = await fetch(`/api/admin/table-data?table=${tableName}`)
    const data = await response.json()
    setTableData(data)
  }

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const handleEditItem = (item: any) => {
    console.log("Edit item:", item)
  }

  const handleDeleteItem = async (item: any) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await fetch(`/api/admin/delete-item?table=${selectedTable}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      fetchTableData(selectedTable!)
    }
  }

  const filteredData = tableData.filter((item) => {
    if (!searchQuery) return true
    return Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchQuery.toLowerCase()),
    )
  })

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-gray-50/90">
      <div className="container mx-auto p-6 h-full flex flex-col">
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-grow overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Database Management</h1>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsCsvModalOpen(true)}>
                Upload CSV
              </Button>
              <Button variant="outline" onClick={() => setIsGeoJsonModalOpen(true)}>
                Upload GeoJSON
              </Button>
              <Button onClick={() => setIsAddItemModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <Select onValueChange={handleTableSelect} value={selectedTable || undefined}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a table" />
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
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {selectedTable ? (
            <div className="flex-grow overflow-hidden">
              <DataTable data={filteredData} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
              Select a table to view its contents
            </div>
          )}
        </div>
      </div>

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onUpload={(data) => {
          console.log("CSV data:", data)
        }}
      />
      <GeoJsonUploadModal
        isOpen={isGeoJsonModalOpen}
        onClose={() => setIsGeoJsonModalOpen(false)}
        onUpload={(data) => {
          console.log("GeoJSON data:", data)
        }}
      />
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onAdd={(item) => {
          console.log("New item:", item)
        }}
        table={selectedTable}
      />
    </div>
  )
}

