"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Camera, Edit3, Save, X } from "lucide-react"
import { useAcoesOptions } from "../hooks/useAcoesOptions"
import { useUpload } from "../hooks/useUpload"

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

interface CardsPreviewProps {
  items: AcaoDraft[]
  onUpdateItem: (tempId: string, updates: Partial<AcaoDraft>) => void
}

export function CardsPreview({ items, onUpdateItem }: CardsPreviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const { acoesOptions } = useAcoesOptions()
  const { uploadPhoto, isUploading } = useUpload()

  const handleEdit = (tempId: string) => {
    setEditingId(tempId)
  }

  const handleSave = () => {
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
  }

  const handlePhotoUpload = async (tempId: string, file: File) => {
    try {
      const url = await uploadPhoto(file)
      const item = items.find((i) => i.tempId === tempId)
      const newFotos = [...(item?.fotos || []), { url, descricao: null }]
      onUpdateItem(tempId, { fotos: newFotos })
    } catch (error) {
      // Error handled by useUpload hook
    }
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {items.map((item) => {
        const isEditing = editingId === item.tempId

        return (
          <Card key={item.tempId} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  {item.acao && (
                    <Badge variant="secondary" className="text-xs">
                      {item.acao}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => (isEditing ? handleSave() : handleEdit(item.tempId))}>
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p>
                  Coordenadas: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}
                </p>
                {item.elevation && <p>Elevação: {item.elevation}m</p>}
                {item.time && <p>Data/Hora: {new Date(item.time).toLocaleString("pt-BR")}</p>}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => onUpdateItem(item.tempId, { name: e.target.value })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Ação</Label>
                      <Select
                        value={item.acao || ""}
                        onValueChange={(value) => onUpdateItem(item.tempId, { acao: value })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {acoesOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Textarea
                      value={item.descricao || ""}
                      onChange={(e) => onUpdateItem(item.tempId, { descricao: e.target.value })}
                      rows={2}
                      className="text-sm"
                      placeholder="Observações sobre este ponto..."
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Fotos</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoUpload(item.tempId, file)
                        }}
                        className="h-8"
                        disabled={isUploading}
                      />
                      {item.fotos && item.fotos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          {item.fotos.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSave} className="h-7 text-xs">
                      Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {item.descricao && <p className="text-sm">{item.descricao}</p>}
                  {item.fotos && item.fotos.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Camera className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-500">
                        {item.fotos.length} foto{item.fotos.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
