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
    if (item) {
      setEditedItem({ ...item })
    }
  }, [item])

  const handleInputChange = (key: string, value: string) => {
    setEditedItem((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    if (editedItem) {
      onSave(editedItem)
      onClose()
    }
  }

  if (!item || !editedItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {Object.entries(editedItem).map(([key, value]) => {
            if (key === "geom") return null // Don't display geom field
            return (
              <div key={key} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={key} className="text-right">
                  {key}
                </Label>
                {key === "id" ? (
                  <Input id={key} value={value as string} disabled className="col-span-2" />
                ) : key === "time" ? (
                  <Input
                    id={key}
                    type="datetime-local"
                    value={(value as string).slice(0, 16)} // Format for datetime-local input
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="col-span-2"
                  />
                ) : (
                  <Input
                    id={key}
                    value={value as string}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="col-span-2"
                  />
                )}
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

