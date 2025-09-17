"use client"

import type React from "react"
import { useState } from "react"
import * as XLSX from "xlsx"
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

interface XlsxUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: any[]) => void
}

export function XlsxUploadModal({ isOpen, onClose, onUpload }: XlsxUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      if (selectedFile.type === fileType || selectedFile.name.endsWith(".xlsx")) {
        setFile(selectedFile)
      } else {
        setError("Por favor, selecione um arquivo .xlsx válido.")
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "buffer" })
        const worksheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[worksheetName]
        const data = XLSX.utils.sheet_to_json(worksheet)
        onUpload(data)
        onClose()
      } catch (err) {
        console.error("Error reading or parsing XLSX file:", err)
        setError("Falha ao processar o arquivo XLSX. Verifique o formato.")
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
          <DialogTitle>Upload de Arquivo XLSX</DialogTitle>
          <DialogDescription>Selecione um arquivo XLSX (.xlsx) para importar dados.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Label htmlFor="xlsx-file-input" className="sr-only">
            Escolher arquivo XLSX
          </Label>
          <Input id="xlsx-file-input" type="file" accept=".xlsx" onChange={handleFileChange} />
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
