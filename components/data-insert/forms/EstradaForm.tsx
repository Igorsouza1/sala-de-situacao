"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { convertGpxToGeoJSON, extractTrackAsWKT, extractWaipointsAsWKT } from "@/lib/helpers/gpxParser"
import dynamic from "next/dynamic"

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


const MapPreview = dynamic(
  () => import("../../mapPreview").then((mod) => mod.MapPreview),
  { ssr: false }
)

type EstradaFormValues = {
  nome: string
  tipo?: string | null
  codigo?: string | null
  gpx: File | null
}

interface EstradaFormProps {
  onValidate: (isValid: boolean) => void
  onPreview: (data: any) => void
}



export function EstradaForm({ onValidate, onPreview }: EstradaFormProps) {
  const [formData, setFormData] = useState<EstradaFormValues>({
    nome: "",
    tipo: "",
    codigo: "",
    gpx: null,
  })
  const [previewGeometry, setPreviewGeometry] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)
  const { toast } = useToast()
  const [waypointWarning, setWaypointWarning] = useState<string | null>(null);
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

  const handleInputChange = (field: keyof EstradaFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    onValidate(false) // Reset validation when form changes
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.toLowerCase().endsWith(".gpx") || file.type === "application/gpx+xml") {
        setFormData((prev) => ({ ...prev, gpx: file }))
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

  const handleValidate = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da estrada é obrigatório.",
        variant: "destructive",
      })
      return
    }

    if (!formData.gpx) {
      toast({
        title: "Arquivo obrigatório",
        description: "O arquivo GPX é obrigatório para estradas.",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)
    setWaypointWarning(null);
    try {
      const formDataToSend = new FormData()
      formDataToSend.append("gpx", formData.gpx)
      formDataToSend.append("nome", formData.nome)
      if (formData.tipo) formDataToSend.append("tipo", formData.tipo)
      if (formData.codigo) formDataToSend.append("codigo", formData.codigo)
      const geojson = await convertGpxToGeoJSON(formData.gpx);
      extractTrackAsWKT(geojson); 
      
      const waypoints = extractWaipointsAsWKT(geojson);

      if (waypoints.length > 0) {
        setWaypointWarning(
          `Seu arquivo contém ${waypoints.length} ponto(s) que serão ignorados, pois estradas não possuem waypoints.`
        );
      }

      setPreviewGeometry(geojson);
      

      onPreview({
        ...formData,
        geometry: geojson, // Passamos o geojson para o preview
        validated: true,
      });
      onValidate(true);
  
      toast({
        title: "Validação local concluída",
        description: "GPX processado com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dados da Estrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Estrada *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Ex: Estrada do Pantanal"
              />
            </div>
            <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
                value={formData.tipo || ""}
                onValueChange={(value) => handleInputChange("tipo", value)}
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pavimentada">Pavimentada</SelectItem>
                  <SelectItem value="Não Pavimentada">Não Pavimentada</SelectItem>
                  <SelectItem value="Implantada">Implantada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              value={formData.codigo || ""}
              onChange={(e) => handleInputChange("codigo", e.target.value)}
              placeholder="Ex: EST-001"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arquivo GPX *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".gpx,application/gpx+xml"
              onChange={handleFileChange}
              className="hidden"
              id="gpx-upload"
            />
            <label htmlFor="gpx-upload" className="cursor-pointer flex flex-col items-center space-y-2">
              {formData.gpx ? (
                <div className="text-center">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <p className="font-semibold">{formData.gpx.name}</p>
                  <p className="text-sm text-muted-foreground">{(formData.gpx.size / 1024).toFixed(2)} KB</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      setFormData((prev) => ({ ...prev, gpx: null }))
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
                  <p className="text-sm text-muted-foreground">Arquivo deve conter track ou route</p>
                </div>
              )}
            </label>
          </div>

          <Button
            onClick={handleValidate}
            disabled={!formData.nome.trim() || !formData.gpx || isValidating}
            className="w-full"
          >
            {isValidating ? "Validando..." : "Validar GPX"}
          </Button>
          {waypointWarning && (
          <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
            <p className="font-bold">Aviso</p>
            <p>{waypointWarning}</p>
          </div>
        )}
        </CardContent>
      </Card>

      {previewGeometry && (
        <Card>
          <CardHeader>
            <CardTitle>Preview do Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <MapPreview geometry={previewGeometry} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
