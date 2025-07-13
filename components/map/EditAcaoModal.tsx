"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface EditAcaoModalProps {
  isOpen: boolean
  onClose: () => void
  acao: any | null
  onSave: (data: any, files: File[]) => void
}

export function EditAcaoModal({ isOpen, onClose, acao, onSave }: EditAcaoModalProps) {
  const [form, setForm] = useState<any>({})
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    if (acao && isOpen) {
      const initial = { ...acao }
      if (initial.time && typeof initial.time === "string") {
        try {
          const d = new Date(initial.time)
          if (!isNaN(d.getTime())) initial.time = d.toISOString().slice(0,16)
        } catch {}
      }
      setForm(initial)
      setFiles([])
    }
  }, [acao, isOpen])

  const handleChange = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const data = { ...form }
    if (data.time && data.time.includes("T")) {
      data.time = new Date(data.time).toISOString()
    }
    onSave(data, files)
  }

  if (!isOpen || !acao) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Editar Ação</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
          {Object.entries(form).map(([key, value]) => {
            if (key === "geom") return null
            return (
              <div key={key} className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
                <Label htmlFor={key} className="md:text-right">{key}</Label>
                {key === "id" ? (
                  <Input id={key} value={String(value)} disabled className="col-span-1 md:col-span-2 bg-muted/50" />
                ) : key === "time" ? (
                  <Input id={key} type="datetime-local" value={value as string || ""} onChange={(e) => handleChange(key, e.target.value)} className="col-span-1 md:col-span-2" />
                ) : (
                  <Input id={key} value={value as string || ""} onChange={(e) => handleChange(key, e.target.value)} className="col-span-1 md:col-span-2" />
                )}
              </div>
            )
          })}
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
            <Label htmlFor="files" className="md:text-right">Fotos</Label>
            <Input id="files" type="file" multiple className="col-span-1 md:col-span-2" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
