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
    if (table) {
      fetchTableFields(table)
    }
  }, [table])

  const fetchTableFields = async (tableName: string) => {
    const response = await fetch(`/api/admin/table-fields?table=${tableName}`)
    const data = await response.json()
    // Filter out 'id' and 'geom' fields
    setFields(data.filter((field: string) => field !== "id" && field !== "geom"))
    setFormData({})
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const formattedData = { ...formData };
  
    // Converte o formato do datetime-local para um formato mais padronizado
    if (formattedData.time) {
      formattedData.time = new Date(formattedData.time).toISOString(); // Garante um formato ISO compatível
    }
  
    onAdd(formattedData);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {fields.map((field) => (
            <div key={field} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={field} className="text-right">
                {field}
              </Label>
              {field === "time" ? (
                <Input
                  id={field}
                  type="datetime-local"
                  value={formData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="col-span-2"
                />
              ) : (
                <Input
                  id={field}
                  value={formData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className="col-span-2"
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

