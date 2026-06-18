"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"

const ACAO_OPTIONS = [
  "Fazenda",
  "Passivo Ambiental",
  "Pesca",
  "Pesca - Crime Ambiental",
  "Ponto de Referencia",
  "Crime Ambiental",
  "Nascente",
  "Plantio",
  "Régua Fluvial",
]

const CATEGORIA_OPTIONS = [
  "Fiscalização",
  "Recuperação",
  "Incidente",
  "Monitoramento",
  "Infraestrutura",
]

const STATUS_OPTIONS = ["Identificado", "Em Recuperação", "Concluído"]

interface CreateAcaoDialogProps {
  regionId: number
  onCreated: () => void
}

export function CreateAcaoDialog({ regionId, onCreated }: CreateAcaoDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    descricao: "",
    time: "",
    acao: "",
    categoria: "",
    status: "",
    tipoTecnico: "",
    carater: "",
    latitude: "",
    longitude: "",
  })

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const setSelect = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value === "__none__" ? "" : value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/regions/${regionId}/acoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          time: form.time || null,
          acao: form.acao || null,
          categoria: form.categoria || null,
          status: form.status || null,
          tipoTecnico: form.tipoTecnico || null,
          carater: form.carater || null,
          latitude: form.latitude || null,
          longitude: form.longitude || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message ?? "Erro ao criar ação")
      }

      setForm({
        name: "", descricao: "", time: "", acao: "", categoria: "",
        status: "", tipoTecnico: "", carater: "", latitude: "", longitude: "",
      })
      setOpen(false)
      onCreated()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao criar ação")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-brand-primary hover:bg-blue-600 text-white">
          <Plus className="w-4 h-4" />
          Nova Ação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Ação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={set("name")} required placeholder="Nome da ação" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={set("descricao")}
              placeholder="Descrição opcional"
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.acao || "__none__"} onValueChange={setSelect("acao")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {ACAO_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria || "__none__"} onValueChange={setSelect("categoria")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {CATEGORIA_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || "__none__"} onValueChange={setSelect("status")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time">Data</Label>
              <Input id="time" type="date" value={form.time} onChange={set("time")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tipoTecnico">Tipo Técnico</Label>
              <Input id="tipoTecnico" value={form.tipoTecnico} onChange={set("tipoTecnico")} placeholder="Ex: Vistoria" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="carater">Caráter</Label>
              <Input id="carater" value={form.carater} onChange={set("carater")} placeholder="Ex: Ativo" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="any" value={form.latitude} onChange={set("latitude")} placeholder="-15.123456" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="any" value={form.longitude} onChange={set("longitude")} placeholder="-55.123456" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-primary hover:bg-blue-600 text-white" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
