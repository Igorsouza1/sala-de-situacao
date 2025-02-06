"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus } from "lucide-react"
import { DataTable } from "./DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CsvUploadModal } from "./CsvUploadModal"
import { GeoJsonUploadModal } from "./GeojsonUpload"
import { AddItemModal } from "./AddItemModal"
import { EditItemModal } from "./EditItemModal"
import { DeleteConfirmationModal } from "./DeleteConfirmationModal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export function AdminPanel() {
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any[]>([])
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false)
  const [isGeoJsonModalOpen, setIsGeoJsonModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingItem, setDeletingItem] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchTables()
  }, [])

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable)
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
        title: "Error",
        description: "Failed to fetch tables. Please try again.",
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
        title: "Error",
        description: `Failed to fetch data for table ${tableName}. Please try again.`,
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
          title: "Success",
          description: "Item added successfully.",
        })
      } catch (error) {
        console.error("Error adding item:", error)
        toast({
          title: "Error",
          description: "Failed to add item. Please try again.",
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
          title: "Success",
          description: "Item deleted successfully.",
        })
      } catch (error) {
        console.error("Error deleting item:", error)
        toast({
          title: "Error",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSaveEdit = async (editedItem: any) => {
    if (selectedTable) {
      
      console.log(editedItem)
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
          title: "Success",
          description: "Item updated successfully.",
        })
      } catch (error) {
        console.error("Error updating item:", error)
        toast({
          title: "Error",
          description: "Failed to update item. Please try again.",
          variant: "destructive",
        })
      }
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
          toast({
            title: "Success",
            description: "CSV data uploaded successfully.",
          })
        }}
      />
      <GeoJsonUploadModal
        isOpen={isGeoJsonModalOpen}
        onClose={() => setIsGeoJsonModalOpen(false)}
        onUpload={(data) => {
          console.log("GeoJSON data:", data)
          toast({
            title: "Success",
            description: "GeoJSON data uploaded successfully.",
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
        itemName={deletingItem ? String(Object.values(deletingItem)[0] ?? "") : ""}
      />
    </div>
  )
}

