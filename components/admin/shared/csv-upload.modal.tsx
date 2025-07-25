"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { UploadCloud } from "lucide-react"

interface CsvUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: string) => void
}

export function CsvUploadModal({ isOpen, onClose, onUpload }: CsvUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        setFile(selectedFile)
      } else {
        setError("Por favor, selecione um arquivo .csv válido.")
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (file) {
      try {
        const text = await file.text()
        onUpload(text)
        onClose()
      } catch (err) {
        setError("Falha ao ler o arquivo. Tente novamente.")
      }
    }
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload de Arquivo CSV</DialogTitle>
          <DialogDescription>Selecione um arquivo CSV para importar dados.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Label htmlFor="csv-file-input" className="sr-only">
            Escolher arquivo CSV
          </Label>
          <Input id="csv-file-input" type="file" accept=".csv" onChange={handleFileChange} />
          {file && <p className="text-sm text-muted-foreground">Arquivo: {file.name}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file}>
            <UploadCloud className="h-4 w-4 mr-2" /> Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
