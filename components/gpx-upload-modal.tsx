"use client"

import type React from "react"

import { useState, useCallback, type DragEvent, startTransition } from "react"
import { useRouter } from "next/navigation"
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
}

export function GpxUploadModal({ isOpen, onClose }: GpxUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  /* ───────── utilidades ───────── */
  const handleFileChange = (selectedFile: File | null) => {
    setError(null)
    if (selectedFile) {
      if (
        selectedFile.name.toLowerCase().endsWith(".gpx") ||
        selectedFile.type === "application/gpx+xml"
      ) {
        setFile(selectedFile)
      } else {
        setError("Formato inválido. Selecione um arquivo .gpx.")
        setFile(null)
      }
    }
  }

  /* ───────── drag-and-drop ───────── */
  const onDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      handleFileChange(e.dataTransfer.files[0])
      e.dataTransfer.clearData()
    }
  }, [])

  /* ───────── input file ───────── */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFileChange(e.target.files[0])
  }

  /* ───────── envio ───────── */
  const uploadGpx = async (gpx: File, force = false): Promise<void> => {
    const form = new FormData()
    form.append("file", gpx)
    form.append("force", String(force))

    const res = await fetch("/api/gpx", { method: "POST", body: form })
    const data = await res.json()

    if (!res.ok) {
      if (data.error === "no_waypoints" && !force) {
        // reenviar ignorando a ausência de waypoints
        return uploadGpx(gpx, true)
      }
      throw new Error(data.error ?? "Falha no upload")
    }

    toast({
      title: "Importação concluída",
      description: `Trilha #${data.trilhaId} criada com sucesso.`,
    })
    // atualiza qualquer lista que dependa das trilhas
    startTransition(() => router.refresh())
  }

  const handleUploadClick = async () => {
    if (!file || error) return
    try {
      setIsSending(true)
      await uploadGpx(file)
      handleClose()
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message ?? "Erro inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  /* ───────── helpers UI ───────── */
  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    const input = document.getElementById("gpx-file-input") as HTMLInputElement
    if (input) input.value = ""
  }

  const handleClose = () => {
    setFile(null)
    setError(null)
    setIsDragging(false)
    onClose()
  }

  /* ───────── JSX ───────── */
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload de Arquivo GPX</DialogTitle>
          <DialogDescription>
            Arraste e solte um arquivo&nbsp;.gpx aqui ou clique para selecionar.
          </DialogDescription>
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
              id="gpx-file-input"
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {file ? (
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
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
                <UploadCloud
                  className={`mx-auto h-12 w-12 ${
                    error ? "text-destructive" : "text-gray-400"
                  }`}
                />
                <p
                  className={`mt-2 text-sm ${
                    error ? "text-destructive" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <span className="font-semibold">Clique para fazer upload</span>{" "}
                  ou arraste e solte
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Apenas arquivos .gpx
                </p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUploadClick}
            disabled={!file || !!error || isSending}
          >
            {isSending ? "Enviando…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
