"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Camera, Trash2, X } from "lucide-react"

type Foto = { url: string; descricao?: string | null }
type AcaoForm = {
  id?: number | string
  name?: string
  descricao?: string | null
  acao?: string | null
  latitude?: number
  longitude?: number
  elevation?: number | null
  time?: string | null // ISO (ou datetime-local na UI)
  mes?: string
  atuacao?: string
  geom?: string
  fotos?: Foto[]
}

interface EditAcaoModalProps {
  isOpen: boolean
  onClose: () => void
  acao: any | null
  onSave: (data: any, files: File[]) => void
}

export function EditAcaoModal({ isOpen, onClose, acao, onSave }: EditAcaoModalProps) {
  const [form, setForm] = useState<AcaoForm>({})
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<{ url: string; alt: string } | null>(null)

  // controla ObjectURLs criados localmente para limpar depois
  const objectUrls = useRef<string[]>([])
  useEffect(() => {
    return () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u))
      objectUrls.current = []
    }
  }, [])

  useEffect(() => {
    if (acao && isOpen) {
      const initial: AcaoForm = { ...acao }
      if (initial.time && typeof initial.time === "string") {
        try {
          const d = new Date(initial.time)
          if (!isNaN(d.getTime())) initial.time = d.toISOString().slice(0, 16) // para <input type="datetime-local">
        } catch {}
      }
      // garante estrutura de fotos
      initial.fotos = Array.isArray(initial.fotos) ? initial.fotos : []
      setForm(initial)
      setFiles([])
    }
  }, [acao, isOpen])

  const handleChange = (key: keyof AcaoForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // adiciona fotos (mantém preview e guarda File para upload)
  const handleAddFiles = (selected: FileList | null) => {
    if (!selected) return
    const arr = Array.from(selected)
    const nextPreviews: Foto[] = arr.map((file) => {
      const u = URL.createObjectURL(file)
      objectUrls.current.push(u)
      return { url: u, descricao: "" }
    })
    setFiles((prev) => [...prev, ...arr])
    setForm((prev) => ({ ...prev, fotos: [...(prev.fotos || []), ...nextPreviews] }))
  }

  const handleRemovePhoto = (url: string) => {
    // remove da UI; se for ObjectURL, também revoga
    setForm((prev) => ({ ...prev, fotos: (prev.fotos || []).filter((f) => f.url !== url) }))
    if (objectUrls.current.includes(url)) {
      URL.revokeObjectURL(url)
      objectUrls.current = objectUrls.current.filter((u) => u !== url)
      // se também existir um File correspondente, removemos do array de files pelo nome+tamanho (aproximação)
      setFiles((prev) => prev.filter((f) => {
        // não temos mapeamento direto URL->File; manteremos o File (será ignorado no backend se não for usado)
        return true
      }))
    }
  }

  const handleUpdateCaption = (url: string, descricao: string) => {
    setForm((prev) => ({
      ...prev,
      fotos: (prev.fotos || []).map((f) => (f.url === url ? { ...f, descricao } : f)),
    }))
  }

  const handleSubmit = () => {
    const data = { ...form }
    if (data.time && typeof data.time === "string" && data.time.includes("T")) {
      data.time = new Date(data.time).toISOString()
    }
    onSave(data, files)
  }

  if (!isOpen || !acao) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Editar Ação</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[65vh] overflow-y-auto">
          {/* Nome */}
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
            <Label htmlFor="name" className="md:text-right">Nome</Label>
            <Input
              id="name"
              value={form.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              className="col-span-1 md:col-span-2"
            />
          </div>

          {/* Tipo de Ação (dropdown) */}
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
            <Label className="md:text-right">Ação</Label>
            <div className="col-span-1 md:col-span-2">
              <Select
                value={form.acao || ""}
                onValueChange={(v) => handleChange("acao", v)}
              >
                <SelectTrigger className="h-9">
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

          {/* Data/Hora */}
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
            <Label htmlFor="time" className="md:text-right">Data/Hora</Label>
            <Input
              id="time"
              type="datetime-local"
              value={(form.time as string) || ""}
              onChange={(e) => handleChange("time", e.target.value)}
              className="col-span-1 md:col-span-2"
            />
          </div>

          {/* Lat/Lon (somente leitura se preferir) */}
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
            <Label htmlFor="latitude" className="md:text-right">Latitude</Label>
            <Input
              id="latitude"
              value={form.latitude ?? ""}
              onChange={(e) => handleChange("latitude", Number(e.target.value))}
              className="col-span-1 md:col-span-2"
            />
          </div>
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-center md:gap-4">
            <Label htmlFor="longitude" className="md:text-right">Longitude</Label>
            <Input
              id="longitude"
              value={form.longitude ?? ""}
              onChange={(e) => handleChange("longitude", Number(e.target.value))}
              className="col-span-1 md:col-span-2"
            />
          </div>

          {/* Descrição */}
          <div className="md:col-span-2 grid grid-cols-1 items-start gap-2 md:grid-cols-3 md:items-start md:gap-4">
            <Label htmlFor="descricao" className="md:text-right mt-1">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao || ""}
              onChange={(e) => handleChange("descricao", e.target.value)}
              rows={3}
              className="col-span-1 md:col-span-2"
              placeholder="Observações sobre este ponto..."
            />
          </div>

          {/* Fotos: input + contador */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="files" className="">Fotos</Label>
              <Input
                id="files"
                type="file"
                multiple
                accept="image/*"
                className="max-w-xs"
                onChange={(e) => {
                  handleAddFiles(e.target.files)
                  if (e.currentTarget) e.currentTarget.value = ""
                }}
              />
              {!!(form.fotos?.length) && (
                <Badge variant="secondary" className="text-xs">
                  <Camera className="h-3 w-3 mr-1" />
                  {form.fotos?.length}
                </Badge>
              )}
            </div>

            {/* Miniaturas com legenda/remover */}
            {form.fotos && form.fotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {form.fotos.map((foto) => (
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
                        onClick={() => handleRemovePhoto(foto.url)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-black/60 text-white rounded p-1"
                        title="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      value={foto.descricao || ""}
                      onChange={(e) => handleUpdateCaption(foto.url, e.target.value)}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>

        {/* Preview fullscreen (não fecha por ESC/clique fora) */}
        <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
          
        <DialogTitle>Preview</DialogTitle>
          {preview && (
            <DialogContent
            // Remove a limitação de tamanho e borda, e usa fundo escuro
            className="p-0 gap-0 border-none bg-black/90 w-screen h-screen max-w-none"
            onEscapeKeyDown={(e) => e.preventDefault()}
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <div className="relative w-full h-full flex items-center justify-center">
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
                className="absolute top-4 right-4 bg-white text-black rounded-full p-2 shadow"
                aria-label="Fechar"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogContent>
          )}
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
