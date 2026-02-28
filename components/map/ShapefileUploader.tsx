"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload, X, Map as MapIcon, Loader2, AlertCircle, Eye } from "lucide-react"
import * as shapefile from "shapefile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ShapefileUploaderProps {
  onPreview: (geojson: any, color: string) => void
  onClearPreview: () => void
  onSaveSuccess: () => void
}

export function ShapefileUploader({ onPreview, onClearPreview, onSaveSuccess }: ShapefileUploaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [regiaoId, setRegiaoId] = useState<string>("")
  const [regioes, setRegioes] = useState<any[]>([])

  const [files, setFiles] = useState<{ shp?: File; dbf?: File; geojson?: File }>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedGeoJson, setParsedGeoJson] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  const [position, setPosition] = useState({ x: -60, y: -250 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 })

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.tagName === 'INPUT') return

    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: position.x,
      initY: position.y
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    setPosition({
      x: dragRef.current.initX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.initY + (e.clientY - dragRef.current.startY)
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  // Fetch regioes for the dropdown
  useEffect(() => {
    async function fetchRegioes() {
      try {
        const response = await fetch('/api/mapLayers/regioes')
        if (response.ok) {
            const data = await response.json()
            setRegioes(data)
        }
      } catch (err) {
        console.error("Failed to fetch regioes", err)
      }
    }
    if (isOpen) {
        fetchRegioes()
    }
  }, [isOpen])


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    let shpFile: File | undefined
    let dbfFile: File | undefined
    let geojsonFile: File | undefined
    let totalSize = 0

    // Reset state
    setError(null)
    setParsedGeoJson(null)
    onClearPreview()

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      totalSize += file.size

      if (file.name.toLowerCase().endsWith('.shp')) shpFile = file
      else if (file.name.toLowerCase().endsWith('.dbf')) dbfFile = file
      else if (file.name.toLowerCase().endsWith('.geojson') || file.name.toLowerCase().endsWith('.json')) geojsonFile = file
    }

    if (totalSize > 10 * 1024 * 1024) {
        setError("O tamanho total dos arquivos excede 10MB.")
        return
    }

    setFiles({ shp: shpFile, dbf: dbfFile, geojson: geojsonFile })
  }

  const processFiles = async () => {
    if (!files.shp && !files.geojson) {
      setError("Selecione pelo menos um arquivo .shp ou .geojson")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      let geojsonResult: any

      if (files.geojson) {
        const text = await files.geojson.text()
        geojsonResult = JSON.parse(text)
      } else if (files.shp) {
        const shpBuffer = await files.shp.arrayBuffer()
        const dbfBuffer = files.dbf ? await files.dbf.arrayBuffer() : undefined

        geojsonResult = await shapefile.read(shpBuffer, dbfBuffer)
      }

      if (!geojsonResult || !geojsonResult.features) {
         throw new Error("Formato inválido ou vazio.")
      }

      setParsedGeoJson(geojsonResult)
      onPreview(geojsonResult, color)
      toast({ title: "Arquivo processado", description: "O preview já está disponível no mapa." })

    } catch (err: any) {
      console.error(err)
      setError(`Erro ao processar: ${err.message || 'Formato desconhecido'}`)
      setParsedGeoJson(null)
      onClearPreview()
    } finally {
      setIsProcessing(false)
    }
  }

  // Update preview when color changes
  useEffect(() => {
     if (parsedGeoJson) {
         onPreview(parsedGeoJson, color)
     }
  }, [color])

  const handleSave = async () => {
    if (!parsedGeoJson || !name || !regiaoId) {
        setError("Preencha todos os campos obrigatórios (Nome, Região e Arquivo válido).")
        return
    }

    setIsUploading(true)
    setError(null)

    try {
        const response = await fetch('/api/mapLayers/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                color,
                regiaoId: parseInt(regiaoId, 10),
                geojson: parsedGeoJson
            })
        })

        if (!response.ok) {
            const errData = await response.json()
            throw new Error(errData.message || "Erro ao salvar")
        }

        toast({ title: "Sucesso!", description: "A camada foi salva com sucesso." })
        setIsOpen(false)
        resetState()
        onSaveSuccess()
    } catch (err: any) {
        setError(err.message || "Ocorreu um erro ao salvar a camada no servidor.")
    } finally {
        setIsUploading(false)
    }
  }

  const resetState = () => {
      setName("")
      setColor("#3b82f6")
      setRegiaoId("")
      setFiles({})
      setParsedGeoJson(null)
      setError(null)
      onClearPreview()
      setPosition({ x: -60, y: -250 })
  }

  return (
    <div className="absolute top-[420px] right-4 z-[400]">
       {!isOpen ? (
        <Button
            variant="outline"
            size="icon"
            className="bg-white hover:bg-gray-100 shadow-md text-black"
            onClick={() => setIsOpen(true)}
            title="Upload de Shapefile"
        >
            <Upload className="h-4 w-4" />
        </Button>
       ) : (
        <div style={{ transform: `translate(${position.x}px, ${position.y}px)`, position: 'absolute', right: 0, top: 0 }}>
        <Card className="w-80 shadow-2xl bg-white/95 backdrop-blur-sm border-slate-200" style={{ touchAction: 'none' }}>
            <CardHeader 
                className={`pb-3 border-b border-slate-100 relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => {
                        setIsOpen(false)
                        resetState()
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-brand-primary" />
                    Adicionar Camada
                </CardTitle>
                <CardDescription className="text-xs">
                    Faça upload de .shp (e .dbf) ou .geojson (Máx 10MB)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                <div className="space-y-1.5">
                    <Label className="text-xs">Nome da Camada *</Label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Área de Preservação"
                        className="h-8 text-xs"
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Região *</Label>
                    <Select value={regiaoId} onValueChange={setRegiaoId}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Selecione uma região" />
                        </SelectTrigger>
                        <SelectContent>
                            {regioes.map(r => (
                                <SelectItem key={r.id} value={r.id.toString()}>{r.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Cor Principal</Label>
                    <div className="flex gap-2 items-center">
                        <Input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-8 w-12 p-1 cursor-pointer"
                        />
                        <span className="text-xs text-slate-500 font-mono">{color.toUpperCase()}</span>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">Arquivos (.shp, .dbf, .geojson)</Label>
                    <Input
                        type="file"
                        multiple
                        accept=".shp,.dbf,.geojson,.json"
                        onChange={handleFileChange}
                        className="text-xs cursor-pointer file:cursor-pointer file:h-full file:bg-transparent file:text-brand-primary file:border-0 file:font-medium file:mr-2"
                    />
                    <div className="flex gap-1 flex-wrap mt-1">
                        {files.shp && <span className="text-[10px] bg-slate-100 px-1 rounded">.shp</span>}
                        {files.dbf && <span className="text-[10px] bg-slate-100 px-1 rounded">.dbf</span>}
                        {files.geojson && <span className="text-[10px] bg-slate-100 px-1 rounded">.geojson</span>}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-2 rounded-md flex items-start gap-2 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                     <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs"
                        onClick={processFiles}
                        disabled={(!files.shp && !files.geojson) || isProcessing}
                    >
                        {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Eye className="h-3 w-3 mr-2" />}
                        Processar e Visualizar
                    </Button>
                    <Button
                        variant="default"
                        size="sm"
                        className="w-full text-xs"
                        onClick={handleSave}
                        disabled={!parsedGeoJson || !name || !regiaoId || isUploading}
                    >
                        {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                        Confirmar e Salvar
                    </Button>
                </div>

            </CardContent>
        </Card>
        </div>
       )}
    </div>
  )
}
