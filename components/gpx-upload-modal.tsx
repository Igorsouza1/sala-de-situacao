"use client"

import type React from "react"
import { useState, useCallback, type DragEvent, startTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  UploadCloud,
  FileText,
  XCircle,
  MapPin,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  Leaf,
  Fish,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Waypoint {
  id: string
  name: string
  lat: number
  lon: number
  elevation?: number
  category?: WaypointCategory
  subcategory?: string
  photo?: File
  notes?: string
}

interface WaypointCategory {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
}

interface Expedition {
  name: string
  description: string
  date: string
  leader: string
}

interface GpxUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

const WAYPOINT_CATEGORIES: WaypointCategory[] = [
  {
    id: "passivo_ambiental",
    name: "Passivo Ambiental",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  {
    id: "plantio",
    name: "Plantio",
    icon: Leaf,
    color: "text-green-500",
  },
  {
    id: "ponto_referencia",
    name: "Ponto de Referência",
    icon: MapPin,
    color: "text-blue-500",
  },
  {
    id: "pesca",
    name: "Pesca",
    icon: Fish,
    color: "text-cyan-500",
  },
]

export function GpxUploadModal({ isOpen, onClose }: GpxUploadModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Dados da expedição
  const [expedition, setExpedition] = useState<Expedition>({
    name: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    leader: "",
  })

  // Waypoints extraídos do GPX
  const [waypoints, setWaypoints] = useState<Waypoint[]>([])
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  const steps = [
    { number: 1, title: "Upload GPX", description: "Selecione o arquivo GPX" },
    { number: 2, title: "Expedição", description: "Configure os dados da expedição" },
    { number: 3, title: "Waypoints", description: "Classifique os pontos encontrados" },
    { number: 4, title: "Revisão", description: "Confirme os dados antes de salvar" },
  ]

  /* ───────── File Upload Logic ───────── */
  const handleFileChange = (selectedFile: File | null) => {
    setError(null)
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith(".gpx") || selectedFile.type === "application/gpx+xml") {
        setFile(selectedFile)
      } else {
        setError("Formato inválido. Selecione um arquivo .gpx.")
        setFile(null)
      }
    }
  }

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFileChange(e.target.files[0])
  }

  /* ───────── GPX Processing ───────── */
  const processGpxFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/gpx/process", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar GPX")
      }

      // Simular waypoints extraídos (em produção viriam da API)
      const extractedWaypoints: Waypoint[] =
        data.waypoints?.map((wp: any, index: number) => ({
          id: `wp-${index}`,
          name: wp.name || `Waypoint ${index + 1}`,
          lat: wp.lat,
          lon: wp.lon,
          elevation: wp.elevation,
        })) || []

      setWaypoints(extractedWaypoints)
      setCurrentStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  /* ───────── Waypoint Management ───────── */
  const updateWaypoint = (id: string, updates: Partial<Waypoint>) => {
    setWaypoints((prev) => prev.map((wp) => (wp.id === id ? { ...wp, ...updates } : wp)))
  }

  const handlePhotoUpload = (waypointId: string, file: File) => {
    updateWaypoint(waypointId, { photo: file })
  }

  /* ───────── Final Submission ───────── */
  const handleFinalSubmit = async () => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("expedition", JSON.stringify(expedition))
      formData.append("waypoints", JSON.stringify(waypoints))
      formData.append("gpxFile", file!)

      // Adicionar fotos dos waypoints
      waypoints.forEach((wp, index) => {
        if (wp.photo) {
          formData.append(`waypoint_photo_${index}`, wp.photo)
        }
      })

      const response = await fetch("/api/expeditions", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Erro ao salvar expedição")
      }

      toast({
        title: "Expedição criada com sucesso!",
        description: `${waypoints.length} waypoints foram processados.`,
      })

      handleClose()
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  /* ───────── UI Helpers ───────── */
  const handleClose = () => {
    setCurrentStep(1)
    setFile(null)
    setError(null)
    setIsDragging(false)
    setWaypoints([])
    setExpedition({
      name: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      leader: "",
    })
    onClose()
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return file && !error
      case 2:
        return expedition.name && expedition.leader
      case 3:
        return waypoints.every((wp) => wp.category)
      default:
        return true
    }
  }

  /* ───────── Render Steps ───────── */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragOver}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                ${isDragging ? "border-primary bg-primary/10" : "border-gray-300 dark:border-gray-600"}
                ${error ? "border-destructive bg-destructive/10" : ""}
                hover:border-gray-400 dark:hover:border-gray-500`}
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
                  <p className="mt-2 font-semibold text-gray-700 dark:text-gray-300">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(2)} KB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setError(null)
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
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expedition-name">Nome da Expedição *</Label>
                <Input
                  id="expedition-name"
                  value={expedition.name}
                  onChange={(e) => setExpedition((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Trilha do Pico da Neblina"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expedition-date">Data</Label>
                <Input
                  id="expedition-date"
                  type="date"
                  value={expedition.date}
                  onChange={(e) => setExpedition((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expedition-leader">Líder da Expedição *</Label>
              <Input
                id="expedition-leader"
                value={expedition.leader}
                onChange={(e) => setExpedition((prev) => ({ ...prev, leader: e.target.value }))}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expedition-description">Descrição</Label>
              <Textarea
                id="expedition-description"
                value={expedition.description}
                onChange={(e) => setExpedition((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva os objetivos e características da expedição..."
                rows={3}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {waypoints.length} waypoints encontrados no arquivo GPX. Classifique cada ponto:
            </div>
            {waypoints.map((waypoint) => (
              <Card key={waypoint.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{waypoint.name}</h4>
                    <p className="text-sm text-gray-500">
                      {waypoint.lat.toFixed(6)}, {waypoint.lon.toFixed(6)}
                      {waypoint.elevation && ` • ${waypoint.elevation}m`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {WAYPOINT_CATEGORIES.map((category) => {
                      const Icon = category.icon
                      const isSelected = waypoint.category?.id === category.id
                      return (
                        <Button
                          key={category.id}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateWaypoint(waypoint.id, { category })}
                          className={isSelected ? "" : category.color}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {category.name}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {waypoint.category && (
                  <div className="mt-3 space-y-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Subcategoria</Label>
                        <Input
                          placeholder="Ex: Erosão, Mudas nativas..."
                          value={waypoint.subcategory || ""}
                          onChange={(e) => updateWaypoint(waypoint.id, { subcategory: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Foto</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handlePhotoUpload(waypoint.id, file)
                            }}
                          />
                          {waypoint.photo && (
                            <Badge variant="secondary" className="text-xs">
                              <Camera className="h-3 w-3 mr-1" />
                              Foto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Observações</Label>
                      <Textarea
                        rows={2}
                        placeholder="Observações sobre este ponto..."
                        value={waypoint.notes || ""}
                        onChange={(e) => updateWaypoint(waypoint.id, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Expedição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong>Nome:</strong> {expedition.name}
                </div>
                <div>
                  <strong>Líder:</strong> {expedition.leader}
                </div>
                <div>
                  <strong>Data:</strong> {new Date(expedition.date).toLocaleDateString("pt-BR")}
                </div>
                {expedition.description && (
                  <div>
                    <strong>Descrição:</strong> {expedition.description}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Waypoints Classificados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {WAYPOINT_CATEGORIES.map((category) => {
                    const count = waypoints.filter((wp) => wp.category?.id === category.id).length
                    const Icon = category.icon
                    return (
                      <div key={category.id} className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${category.color}`} />
                        <span className="text-sm">
                          {category.name}: {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Separator className="my-3" />
                <div className="text-sm text-gray-600">
                  Total: {waypoints.length} waypoints • {waypoints.filter((wp) => wp.photo).length} com fotos
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Expedição GPX</DialogTitle>
          <DialogDescription>{steps[currentStep - 1].description}</DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {currentStep > step.number ? <Check className="h-4 w-4" /> : step.number}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">{renderStepContent()}</div>

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : () => setCurrentStep((prev) => prev - 1)}
            disabled={isProcessing}
          >
            {currentStep === 1 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </>
            )}
          </Button>

          <Button
            onClick={
              currentStep === 1
                ? processGpxFile
                : currentStep === 4
                  ? handleFinalSubmit
                  : () => setCurrentStep((prev) => prev + 1)
            }
            disabled={!canProceedToNext() || isProcessing}
          >
            {isProcessing ? (
              "Processando..."
            ) : currentStep === 1 ? (
              "Processar GPX"
            ) : currentStep === 4 ? (
              "Finalizar Expedição"
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
