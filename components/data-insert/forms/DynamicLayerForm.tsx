"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

// --- TYPES & INTERFACES ---

interface LayerCatalogOption {
    id: number
    slug: string
    name: string
    schemaConfig: Record<string, any>
}

interface DynamicLayerFormProps {
    onValidate: (isValid: boolean) => void
    onPreview: (data: any) => void
}

export function DynamicLayerForm({ onValidate, onPreview }: DynamicLayerFormProps) {
    const [layers, setLayers] = useState<LayerCatalogOption[]>([])
    const [selectedLayer, setSelectedLayer] = useState<LayerCatalogOption | null>(null)
    const [isLoadingLayers, setIsLoadingLayers] = useState(false)
    
    // Form State
    const [formData, setFormData] = useState({
        lat: "",
        lng: "",
        properties: {} as Record<string, any>
    })

    // Fetch Layers on Mount
    useEffect(() => {
        const fetchLayers = async () => {
            try {
                setIsLoadingLayers(true)
                const res = await fetch('/api/layers') 
                if(!res.ok) throw new Error("Failed to fetch layers")
                const data = await res.json()
                // Filter only Dynamic layers
                setLayers(data.filter((l: any) => l.slug !== 'acoes' && l.slug !== 'estrada')) 
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoadingLayers(false)
            }
        }
        fetchLayers()
    }, [])

    const handleLayerChange = (slug: string) => {
        const layer = layers.find(l => l.slug === slug) || null
        setSelectedLayer(layer)
        setFormData(prev => ({ ...prev, properties: {} }))
        onValidate(false)
    }

    const validateAndPreview = (currentData: typeof formData) => {
         const lat = parseFloat(currentData.lat)
         const lng = parseFloat(currentData.lng)

         if (isNaN(lat) || Math.abs(lat) > 90) return
         if (isNaN(lng) || Math.abs(lng) > 180) return
         if (!selectedLayer) return

         const geojson = {
            type: "Point",
            coordinates: [lng, lat]
        }

        const formattedData = {
           layerSlug: selectedLayer.slug,
           geojson: geojson,
           properties: currentData.properties
        }

        onPreview(formattedData)
        onValidate(true)
    }

    const handleChange = (field: string, value: string) => {
         const newData = { ...formData, [field]: value }
         setFormData(newData)
         validateAndPreview(newData)
    }

    const handlePropertyChange = (key: string, value: string) => {
        const newProps = { ...formData.properties, [key]: value }
        const newData = { ...formData, properties: newProps }
        setFormData(newData)
        validateAndPreview(newData)
    }

    return (
        <div className="space-y-6">
            {/* Layer Selection */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Selecione a Camada</label>
                <Select onValueChange={handleLayerChange} disabled={isLoadingLayers}>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingLayers ? "Carregando..." : "Escolha uma camada"} />
                    </SelectTrigger>
                    <SelectContent>
                        {layers.map(layer => (
                            <SelectItem key={layer.id} value={layer.slug}>{layer.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedLayer && (
                <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Latitude</label>
                            <Input 
                                placeholder="-21.123" 
                                value={formData.lat}
                                onChange={(e) => handleChange("lat", e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Longitude</label>
                            <Input 
                                placeholder="-57.123" 
                                value={formData.lng}
                                onChange={(e) => handleChange("lng", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Dynamic Properties based on Schema Config */}
                    <div className="space-y-4 border p-4 rounded-md bg-slate-50">
                        <h4 className="text-sm font-semibold">Propriedades</h4>
                         {selectedLayer.schemaConfig && Object.entries(selectedLayer.schemaConfig).map(([key, config]: [string, any]) => (
                            <div key={key} className="space-y-2">
                                <label className="text-sm font-medium">{config.label || key}</label>
                                <Input 
                                    value={formData.properties[key] || ""}
                                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                                />
                            </div>
                         ))}
                         {(!selectedLayer.schemaConfig || Object.keys(selectedLayer.schemaConfig).length === 0) && (
                             <p className="text-xs text-muted-foreground">Esta camada não possui campos pré-configurados.</p>
                         )}
                    </div>
                </div>
            )}
        </div>
    )
}
