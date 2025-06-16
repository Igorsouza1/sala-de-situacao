"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: any) => void
  table: string | null
}

export function AddItemModal({ isOpen, onClose, onAdd, table }: AddItemModalProps) {
  const [fields, setFields] = useState<string[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (table && isOpen) {
      // Fetch fields when modal opens and table is selected
      fetchTableFields(table)
    } else if (!isOpen) {
      // Clear form data when modal closes
      setFormData({})
      setFields([])
    }
  }, [table, isOpen])

  const fetchTableFields = async (tableName: string) => {
    try {
      const response = await fetch(`/api/admin/table-fields?table=${tableName}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Filter out 'id' and 'geom' fields
      setFields(data.filter((field: string) => field !== "id" && field !== "geom"))
      setFormData({}) // Reset form data for new fields
    } catch (error) {
      console.error("Error fetching table fields:", error)
      // Optionally, show a toast message to the user
      setFields([]) // Clear fields on error
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const formattedData = { ...formData }

    // Converte o formato do datetime-local para um formato mais padronizado
    // Apenas se o campo 'time' existir nos campos atuais (evita erro se 'time' não for um campo da tabela)
    if (fields.includes("time") && formattedData.time) {
      try {
        formattedData.time = new Date(formattedData.time).toISOString()
      } catch (e) {
        console.error("Error formatting time:", e)
        // Handle invalid date string if necessary, e.g., show an error
      }
    }

    onAdd(formattedData)
    // onClose(); // onClose is typically called by the parent after successful onAdd
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {fields.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center">Carregando campos da tabela...</p>
          )}
          {fields.map((field) => (
            <div key={field} className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
              <Label htmlFor={field} className="md:text-right">
                {field}
              </Label>
              {field === "time" ? (
                <Input
                  id={field}
                  type="datetime-local"
                  value={formData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="col-span-1 md:col-span-2"
                />
              ) : (
                <Input
                  id={field}
                  value={formData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="col-span-1 md:col-span-2"
                  placeholder={`Valor para ${field}`}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={fields.length === 0}>
            Adicionar Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
