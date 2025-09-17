"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Camera, Edit3, Save, X, Trash2 } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type Foto = { url: string; descricao?: string | null; file?: File }
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
  fotos?: Foto[]
}

interface CardsPreviewProps {
  items: AcaoDraft[]
  onUpdateItem: (tempId: string, updates: Partial<AcaoDraft>) => void
}

export function CardsPreview({ items, onUpdateItem }: CardsPreviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; alt: string } | null>(null)

  // guarda/revoga ObjectURLs criados localmente
  const objectUrls = useRef<string[]>([])
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u))
      objectUrls.current = []
    }
  }, [])

  const handlePhotoUpload = (tempId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file)
    objectUrls.current.push(previewUrl)
    const item = items.find((i) => i.tempId === tempId)
    const newFotos = [...(item?.fotos || []), { url: previewUrl, descricao: null, file }]
    onUpdateItem(tempId, { fotos: newFotos })
  }

  const handleRemovePhoto = (tempId: string, url: string) => {
    const item = items.find((i) => i.tempId === tempId)
    if (!item?.fotos) return
    onUpdateItem(tempId, { fotos: item.fotos.filter((f) => f.url !== url) })
    if (objectUrls.current.includes(url)) {
      URL.revokeObjectURL(url)
      objectUrls.current = objectUrls.current.filter((u) => u !== url)
    }
  }

  const handleUpdateCaption = (tempId: string, url: string, descricao: string) => {
    const item = items.find((i) => i.tempId === tempId)
    if (!item?.fotos) return
    onUpdateItem(tempId, { fotos: item.fotos.map((f) => (f.url === url ? { ...f, descricao } : f)) })
  }

  return (
    <>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {items.map((item) => {
          const isEditing = editingId === item.tempId

          return (
            <Card key={item.tempId}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {item.acao && <Badge variant="secondary" className="text-xs">{item.acao}</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(isEditing ? null : item.tempId)}
                  >
                    {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Coordenadas: {item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</p>
                  {item.elevation != null && <p>Elevação: {item.elevation} m</p>}
                  {item.time && <p>Data/Hora: {new Date(item.time).toLocaleString("pt-BR")}</p>}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <SelectItem value="Fazenda">Fazenda</SelectItem>
                            <SelectItem value="Passivo Ambiental">Passivo Ambiental</SelectItem>
                            <SelectItem value="Pesca">Pesca</SelectItem>
                            <SelectItem value="Pesca - Crime Ambiental">Pesca - Crime Ambiental</SelectItem>
                            <SelectItem value="Ponto de Referencia">Ponto de Referência</SelectItem>
                            <SelectItem value="Crime Ambiental">Crime Ambiental</SelectItem>
                            <SelectItem value="Nascente">Nascente</SelectItem>
                            <SelectItem value="Plantio">Plantio</SelectItem>
                            <SelectItem value="Régua Fluvial">Régua Fluvial</SelectItem>
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

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Fotos</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoUpload(item.tempId, file)
                            e.currentTarget.value = "" // permite reenviar o mesmo arquivo
                          }}
                          className="h-8 max-w-xs"
                        />
                        {item.fotos?.length ? (
                          <Badge variant="secondary" className="text-xs">
                            <Camera className="h-3 w-3 mr-1" />
                            {item.fotos.length}
                          </Badge>
                        ) : null}
                      </div>

                      {item.fotos?.length ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {item.fotos.map((foto) => (
                            <div key={foto.url} className="group">
                              <div className="relative w-full aspect-square overflow-hidden rounded-md border">
                                <Image
                                  src={foto.url}
                                  alt={foto.descricao || "Foto"}
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                                  className="object-cover cursor-pointer"
                                  onClick={() => setPreview({ url: foto.url, alt: foto.descricao || "Foto" })}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(item.tempId, foto.url)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded p-1"
                                  title="Remover"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <Input
                                value={foto.descricao || ""}
                                onChange={(e) => handleUpdateCaption(item.tempId, foto.url, e.target.value)}
                                placeholder="Legenda (opcional)"
                                className="mt-1 h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Nenhuma foto adicionada.</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={() => setEditingId(null)} className="h-7 text-xs">
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs">
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {item.descricao && <p className="text-sm">{item.descricao}</p>}
                    {item.fotos?.length ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Camera className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {item.fotos.length} foto{item.fotos.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1">
                          {item.fotos.slice(0, 6).map((f) => (
                            <div key={f.url} className="relative w-full aspect-square overflow-hidden rounded">
                              <Image
                                src={f.url}
                                alt={f.descricao || "Foto"}
                                fill
                                sizes="100px"
                                className="object-cover cursor-pointer"
                                onClick={() => setPreview({ url: f.url, alt: f.descricao || "Foto" })}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {/* Preview simples (não fecha por ESC/clique fora) */}
        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          {preview && (
            <DialogContent
              className="p-0 gap-0 border-none bg-black/90 max-w-none"
              onEscapeKeyDown={(e) => e.preventDefault()}
              onPointerDownOutside={(e) => e.preventDefault()}
            >
              <div className="relative w-[min(90vw,900px)] h-[min(80vh,700px)] mx-auto">
                <Image
                  src={preview.url}
                  alt={preview.alt}
                  fill
                  className="object-contain select-none"
                  draggable={false}
                  priority
                />
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="absolute top-2 right-2 bg-white text-black rounded-full p-2 shadow"
                  aria-label="Fechar"
                  title="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </>
  )
}
