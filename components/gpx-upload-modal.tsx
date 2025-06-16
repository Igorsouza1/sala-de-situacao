"use client"

import type React from "react"

import { useState, useCallback, type DragEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { UploadCloud, FileText, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GpxUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File) => void
}

export function GpxUploadModal({ isOpen, onClose, onUpload }: GpxUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (selectedFile: File | null) => {
    setError(null)
    if (selectedFile) {
      if (selectedFile.name.endsWith(".gpx") || selectedFile.type === "application/gpx+xml") {
        setFile(selectedFile)
      } else {
        setError("Formato de arquivo inválido. Por favor, selecione um arquivo .gpx.")
        setFile(null)
      }
    }
  }

  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault() // Necessário para permitir o drop
  }, [])

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFileChange(event.dataTransfer.files[0])
      event.dataTransfer.clearData()
    }
  }, [])

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFileChange(event.target.files[0])
    }
  }

  const handleUploadClick = () => {
    if (file) {
      onUpload(file)
      toast({
        title: "Sucesso",
        description: `Arquivo GPX "${file.name}" enviado.`,
      })
      handleClose()
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    // Resetar o valor do input file para permitir selecionar o mesmo arquivo novamente
    const fileInput = document.getElementById("gpx-file-input") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const handleClose = () => {
    setFile(null)
    setIsDragging(false)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload de Arquivo GPX</DialogTitle>
          <DialogDescription>Arraste e solte um arquivo .gpx aqui, ou clique para selecionar.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer
            ${isDragging ? "border-primary bg-primary/10" : "border-gray-300 dark:border-gray-600"}
            ${error ? "border-destructive bg-destructive/10" : ""}
            hover:border-gray-400 dark:hover:border-gray-500 transition-colors`}
            onClick={() => document.getElementById("gpx-file-input")?.click()}
          >
            <input
              type="file"
              id="gpx-file-input"
              accept=".gpx,application/gpx+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />
            {file ? (
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300">{file.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile()
                  }}
                  className="mt-2 text-destructive hover:text-destructive-foreground"
                >
                  <XCircle className="h-4 w-4 mr-1" /> Remover
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className={`mx-auto h-12 w-12 ${error ? "text-destructive" : "text-gray-400"}`} />
                <p className={`mt-2 text-sm ${error ? "text-destructive" : "text-gray-500 dark:text-gray-400"}`}>
                  <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Apenas arquivos .gpx</p>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleUploadClick} disabled={!file || !!error}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
