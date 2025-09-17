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

interface GeoJsonUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: any) => void
}

export function GeoJsonUploadModal({ isOpen, onClose, onUpload }: GeoJsonUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (
        ["application/geo+json", "application/json"].includes(selectedFile.type) ||
        selectedFile.name.endsWith(".geojson") ||
        selectedFile.name.endsWith(".json")
      ) {
        setFile(selectedFile)
      } else {
        setError("Por favor, selecione um arquivo .geojson ou .json válido.")
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (file) {
      try {
        const text = await file.text()
        const json = JSON.parse(text)
        onUpload(json)
        onClose()
      } catch (err) {
        setError("Falha ao processar o arquivo GeoJSON. Verifique o formato.")
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
          <DialogTitle>Upload de Arquivo GeoJSON</DialogTitle>
          <DialogDescription>Selecione um arquivo GeoJSON (.geojson ou .json) para importar.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Label htmlFor="geojson-file-input" className="sr-only">
            Escolher arquivo GeoJSON
          </Label>
          <Input id="geojson-file-input" type="file" accept=".geojson,.json" onChange={handleFileChange} />
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
