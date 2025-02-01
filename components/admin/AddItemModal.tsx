import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
    setFields(data)
    setFormData({})
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    onAdd(formData)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        {fields.map((field) => (
          <Input
            key={field}
            placeholder={field}
            value={formData[field] || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
          />
        ))}
        <Button onClick={handleSubmit}>Add Item</Button>
      </DialogContent>
    </Dialog>
  )
}
