"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, XCircle } from "lucide-react"
import { CardsPreview } from "../preview/CardsPreview"
import { useToast } from "@/hooks/use-toast"
import { convertGpxToGeoJSON, extractTrackAsWKT, extractWaipointsAsWKT } from "@/lib/helpers/gpxParser"

import dynamic from "next/dynamic"

const MapPreview = dynamic(
  () => import("../../mapPreview").then((mod) => mod.MapPreview),
  { ssr: false }
)

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

type AcaoDraft = {
  tempId: string
  name: string
  descricao?: string | null
  acao?: string | null
  latitude: number
  longitude: number
  elevation?: number | null
  time?: string | null
  mes: string
  atuacao: "Rio da Prata"
  geom: string
  fotos?: { url: string; descricao?: string | null }[]
}

type AcoesFormState = {
  trilhaPreview?: { bbox: number[]; line: string } | null
  items: AcaoDraft[]
}

interface AcoesFormProps {
  onValidate: (isValid: boolean) => void
  onPreview: (data: any) => void
}

export function AcoesForm({ onValidate, onPreview }: AcoesFormProps) {
  const [gpxFile, setGpxFile] = useState<File | null>(null)
  const [formState, setFormState] = useState<AcoesFormState>({
    trilhaPreview: null,
    items: [],
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewGeometry, setPreviewGeometry] = useState<any>(null)
  useEffect(() => {
    import("leaflet").then(L => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
  
      L.Icon.Default.mergeOptions({
          iconUrl: markerIcon.src,
          iconRetinaUrl: markerIcon2x.src,
          shadowUrl: markerShadow.src,
      });
    });
  }, []);

  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.toLowerCase().endsWith(".gpx") || file.type === "application/gpx+xml") {
        setGpxFile(file)
        onValidate(false)
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Selecione um arquivo GPX válido.",
          variant: "destructive",
        })
      }
    }
  }

  const handleParseGpx = async () => {
    if (!gpxFile) return

    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("gpx", gpxFile)

      const geojsonP = await convertGpxToGeoJSON(gpxFile);
      const track = extractTrackAsWKT(geojsonP); 


      const waypoints = extractWaipointsAsWKT(geojsonP);
      if (waypoints.length === 0) {
        throw new Error("Nenhum waypoint encontrado no arquivo GPX.")
      }

      setPreviewGeometry(geojsonP);
      

      onPreview({
        ...formData,
        geometry: geojsonP, // Passamos o geojson para o preview
        validated: true,
      });
      onValidate(true);

      const trilhapreviewbox = {
        bbox: geojsonP.bbox || [],
        line: track || "",
      }

      const newFormState: AcoesFormState = {
        trilhaPreview: trilhapreviewbox || null,
        items: waypoints.map((wp: any, index: number) => ({
          tempId: `wp-${index}`,
          name: wp.nome || `Waypoint ${index + 1}`,
          descricao: wp.description || null,
          acao: null,
          latitude: wp.lat,
          longitude: wp.lon,
          elevation: wp.ele || null,
          time: wp.horario || null,
          mes: wp.mes || "Janeiro", // Derived from time
          atuacao: "Rio da Prata",
          geom: `POINTZ(${wp.longitude} ${wp.latitude} ${wp.elevation || 0})`,
          fotos: [],
        })),
      }

      setFormState(newFormState)
      onPreview(newFormState)
      onValidate(true)

      toast({
        title: "GPX processado",
        description: `${waypoints.length} waypoints encontrados!`,
      })
    } catch (error: any) {
      toast({
        title: "Erro no processamento",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const updateItem = (tempId: string, updates: Partial<AcaoDraft>) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.tempId === tempId ? { ...item, ...updates } : item)),
    }))

    // Update preview data
    const updatedState = {
      ...formState,
      items: formState.items.map((item) => (item.tempId === tempId ? { ...item, ...updates } : item)),
    }
    onPreview(updatedState)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload GPX para Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={handleFileChange}
              className="hidden"
              id="gpx-acoes-upload"
            />
            <label htmlFor="gpx-acoes-upload" className="cursor-pointer flex flex-col items-center space-y-2">
              {gpxFile ? (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <p className="font-semibold">{gpxFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(gpxFile.size / 1024).toFixed(2)} KB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      setGpxFile(null)
                      setFormState({ trilhaPreview: null, items: [] })
                      onValidate(false)
                    }}
                    className="mt-2"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="font-semibold">Clique para selecionar GPX</p>
                  <p className="text-sm text-muted-foreground">Arquivo deve conter waypoints</p>
                </div>
              )}
            </label>
          </div>

          <Button onClick={handleParseGpx} disabled={!gpxFile || isProcessing} className="w-full">
            {isProcessing ? "Processando..." : "Processar GPX"}
          </Button>
        </CardContent>
      </Card>

      {previewGeometry && (
        <Card>
          <CardHeader>
            <CardTitle>Preview da Trilha</CardTitle>
          </CardHeader>
          <CardContent>
            <MapPreview geometry={previewGeometry} />
          </CardContent>
        </Card>
      )}

      {formState.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waypoints Encontrados ({formState.items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <CardsPreview items={formState.items} onUpdateItem={updateItem} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
