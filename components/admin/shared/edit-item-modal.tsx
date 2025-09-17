"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface EditItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: any) => void
  item: any | null
}

export function EditItemModal({ isOpen, onClose, onSave, item }: EditItemModalProps) {
  const [editedItem, setEditedItem] = useState<any>(null)

  useEffect(() => {
    if (item && isOpen) {
      const initialItem = { ...item }
      if (initialItem.time && typeof initialItem.time === "string") {
        try {
          const date = new Date(initialItem.time)
          if (!isNaN(date.getTime())) {
            initialItem.time = date.toISOString().slice(0, 16)
          }
        } catch (e) {
          console.error("Error parsing date for 'time' field:", e)
        }
      }
      setEditedItem(initialItem)
    } else if (!isOpen) {
      setEditedItem(null)
    }
  }, [item, isOpen])

  const handleInputChange = (key: string, value: string) => {
    setEditedItem((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    if (editedItem) {
      const itemToSave = { ...editedItem }
      if (itemToSave.time && typeof itemToSave.time === "string" && itemToSave.time.includes("T")) {
        try {
          itemToSave.time = new Date(itemToSave.time).toISOString()
        } catch (e) {
          console.error("Error converting time back to ISOString:", e)
        }
      }
      onSave(itemToSave)
    }
  }

  if (!isOpen || !editedItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(editedItem).map(([key, value]) => {
            if (key === "geom") return null
            return (
              <div key={key} className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
                <Label htmlFor={key} className="md:text-right">
                  {key}
                </Label>
                {key === "id" ? (
                  <Input id={key} value={value as string} disabled className="col-span-1 md:col-span-2 bg-muted/50" />
                ) : key === "time" ? (
                  <Input
                    id={key}
                    type="datetime-local"
                    value={(value as string) || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="col-span-1 md:col-span-2"
                  />
                ) : (
                  <Input
                    id={key}
                    value={(value as string) || ""}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="col-span-1 md:col-span-2"
                    placeholder={`Valor para ${key}`}
                  />
                )}
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
