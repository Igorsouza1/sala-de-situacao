"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { useAcaoHistory } from "@/hooks/useAcaoHistory"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/helpers/formatter/formatDate"
import { MapPin, Calendar, Tag, Camera, PlusCircle, AlertCircle, CheckCircle2, Clock, X, Trash2, LocateFixed, Loader2  } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ImageModal } from "@/components/ui/image-modal"
import { ConfirmDestructive } from "@/components/ui/confirm-destructive"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useUserRole } from "@/hooks/useUserRole"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface HistoryUpdate {
  id: string
  tipoUpdate: "criacao" | "midia"
  timestamp?: string
  descricao?: string
  urlMidia?: string
}

interface Dossie {
  name: string
  acao: string
  status: string
  time?: string
  latitude?: string
  longitude?: string
  history: HistoryUpdate[]
}


const STATUS_OPTIONS = ["Identificado", "Monitoramento", "Concluido"] as const

const ACTION_TYPE_OPTIONS = [
  "Passivo Ambiental",
  "Ponto de Referencia",
  "Crime Ambiental",
  "Nascente",
  "Plantio",
  "Régua Fluvial",
] as const



const getStatusColor = (status: string): { bg: string; text: string; border: string; icon: React.ReactNode } => {
  const normalizedStatus = status
    ? status
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
    : ""

  if (normalizedStatus.includes("concluido") || normalizedStatus.includes("ativo")) {
    return {
      bg: "bg-primary-green/10",
      text: "text-primary-green",
      border: "border-primary-green/20",
      icon: <CheckCircle2 className="w-4 h-4" />,
    }
  }

  if (normalizedStatus.includes("monitoramento") || normalizedStatus.includes("pendente") || normalizedStatus.includes("aguardando")) {
    return {
      bg: "bg-primary-yellow/10",
      text: "text-primary-yellow",
      border: "border-primary-yellow/20",
      icon: <Clock className="w-4 h-4" />,
    }
  }

  if (normalizedStatus.includes("identificado")) {
    return {
      bg: "bg-brand-primary/10",
      text: "text-brand-primary",
      border: "border-brand-primary/20",
      icon: <Tag className="w-4 h-4" />,
    }
  }

  if (normalizedStatus.includes("erro") || normalizedStatus.includes("cancelado")) {
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      icon: <AlertCircle className="w-4 h-4" />,
    }
  }

  return {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: <Tag className="w-4 h-4" />,
  }
}

const DetailItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-start gap-2 p-2 rounded-md bg-white/50">
    <Icon className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="text-sm text-slate-900 truncate">{value}</p>
    </div>
  </div>
)

const ImageDisplay = ({ src, alt, onClick }: { src: string; alt: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
  >
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      className="w-full h-48 object-cover rounded-lg border border-slate-200"
    />
  </button>
)

const LoadingState = () => (
  <div className="space-y-4">
    <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>

    <div className="space-y-3">
      <Skeleton className="h-5 w-1/4" />
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
    <p className="text-sm text-red-700 font-medium">{message}</p>
  </div>
)

const EmptyState = () => (
  <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-center">
    <p className="text-slate-600 font-medium">Nenhum histórico encontrado</p>
    <p className="text-sm text-slate-500 mt-1">Os eventos aparecerão aqui conforme são criados</p>
  </div>
)

const HistoryTimeline = ({
  history,
  onDelete,
  onImageClick,
}: {
  history: HistoryUpdate[]
  onDelete: (id: string) => void
  onImageClick: (url: string) => void
}) => (
  <div className="relative pl-3 space-y-6 pt-2">
    <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
    
    {history.map((update, index) => {
       // Visual logic
       let dotColor = "border-slate-400"

       if (update.tipoUpdate === "criacao") {
         dotColor = "border-primary-green"
       } else if (update.tipoUpdate === "midia") {
         dotColor = "border-brand-primary"
       }

       return (
      <div key={update.id} className="relative pl-6">
        {/* Timeline Dot */}
        <div className={`absolute left-0 top-1.5 w-[9px] h-[9px] rounded-full border-2 bg-white z-10 
          ${dotColor}`} 
          style={{ transform: "translateX(-4px)" }}
        />

        <div className="flex flex-col gap-1.5 group">
          <div className="flex items-center justify-between">
            {/* Header: Date only */}
            <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-slate-700">
                    {formatDate(update.timestamp || "")}
                </span>
            </div>

            <ConfirmDestructive
              onConfirm={() => onDelete(update.id)}
              title="Excluir item do histórico?"
              description="Esta ação removerá este registro permanentemente."
              confirmLabel="Excluir"
              cancelLabel="Cancelar"
              trigger={
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50"
                  aria-label="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              }
            />
          </div>

          {/* Content Card */}
          <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm hover:border-brand-primary/30 transition-colors mt-1">
            {update.urlMidia && (
              <div className="relative group/image overflow-hidden rounded-md border border-slate-100 bg-slate-50 mb-3">
                <div 
                  onClick={() => onImageClick(update.urlMidia!)}
                  className="cursor-pointer aspect-video relative"
                >
                  <img
                    src={update.urlMidia || "/placeholder.svg"}
                    alt="Mídia"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                  />
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white opacity-0 group-hover/image:opacity-100 drop-shadow-lg transition-all transform scale-75 group-hover/image:scale-100" />
                    </div>
                </div>
              </div>
            )}

            {update.descricao ? (
               <p className="text-sm text-slate-700 leading-relaxed font-normal">
                 {update.descricao}
               </p>
            ) : (
                // If no description, show fallback text only if it's creation
                update.tipoUpdate === "criacao" && (
                    <p className="text-sm text-slate-400 italic">Dossiê criado.</p>
                )
            )}
          </div>
        </div>
      </div>
    )})}
  </div>
)

const AddHistoryForm = ({ acaoId, onSuccess, onCancel }: { acaoId: number; onSuccess: () => void; onCancel: () => void }) => {
  const [file, setFile] = useState<File | null>(null)
  const [descricao, setDescricao] = useState("")
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}` // formato yyyy-mm-dd pro input date
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (!file && !descricao.trim()) {
      toast({
        title: "Erro",
        description: "É necessário fornecer uma mídia ou uma descrição",
        variant: "destructive",
      })
      return
    }
  
    setIsSubmitting(true)
  
    try {
      let blobUrl: string | null = null
  
      // 1) PEDIR URL DE UPLOAD
      if (file) {
        const presignRes = await fetch(`/api/acoes/${acaoId}/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name }),
        })
  
        const presignText = await presignRes.text() // <- sempre lê o texto
        let presignData: any = null
        try {
          presignData = JSON.parse(presignText)
        } catch {
          // se não for JSON, já é pista
        }
  
        if (!presignRes.ok || !presignData?.success) {
          console.error("Erro presign:", presignRes.status, presignText)
          throw new Error(
            `Erro ao gerar URL de upload (status ${presignRes.status}): ${presignText.slice(0, 200)}`
          )
        }
  
        const { uploadUrl, blobUrl: finalUrl } = presignData.data
  
        // 2) UPLOAD DIRETO PRO AZURE
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        })
  
        const uploadText = await uploadRes.text()
        if (!uploadRes.ok) {
          console.error("Erro upload Azure:", uploadRes.status, uploadText)
          throw new Error(
            `Falha no upload para o Azure (status ${uploadRes.status}): ${uploadText.slice(0, 200)}`
          )
        }
  
        blobUrl = finalUrl
      }
  
      // 3) REGISTRAR HISTÓRICO NO BACKEND
      const res = await fetch(`/api/acoes/${acaoId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: descricao.trim() || undefined,
          data: selectedDate,
          urlMidia: blobUrl,
        }),
      })
  
      const resText = await res.text()
      let data: any = null
      try {
        data = JSON.parse(resText)
      } catch {
        // idem, já é pista
      }
  
      if (!res.ok || !data?.success) {
        console.error("Erro registrar update:", res.status, resText)
        throw new Error(
          `Erro ao adicionar item (status ${res.status}): ${resText.slice(0, 200)}`
        )
      }
  
      toast({
        title: "Sucesso",
        variant: "success",
        description: data.data?.message || "Item adicionado ao histórico com sucesso!",
      })
  
      setFile(null)
      setDescricao("")
      onSuccess()
    } catch (error: any) {
      console.error("Erro geral no handleSubmit:", error)
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar item ao histórico",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white/50 border border-slate-200 rounded-lg space-y-5 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h5 className="font-semibold text-sm text-brand-dark-blue flex items-center gap-2">
           <PlusCircle className="w-4 h-4 text-brand-primary" />
           Novo Registro
        </h5>
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={onCancel} 
          className="h-6 w-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid gap-4">
        {/* Data */}
        <div className="space-y-1.5">
          <Label htmlFor="data" className="text-xs font-medium text-slate-600">
            Data do Evento
          </Label>
          <Input
            id="data"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 text-xs bg-white border-slate-200 focus-visible:ring-brand-primary/20"
          />
        </div>

        {/* Upload Area Customizada */}
        <div className="space-y-1.5">
           <Label className="text-xs font-medium text-slate-600">Mídia (Opcional)</Label>
           <div className="relative">
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label 
                htmlFor="file-upload"
                className={`
                  flex items-center justify-center gap-3 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all
                  ${file 
                    ? "border-brand-primary/40 bg-brand-primary/5 text-brand-primary" 
                    : "border-slate-200 hover:border-brand-primary/30 hover:bg-slate-50 text-slate-500"
                  }
                `}
              >
                  {file ? (
                     <>
                       <Camera className="w-5 h-5 flex-shrink-0" />
                       <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
                       <Button 
                         type="button" 
                         variant="ghost" 
                         size="icon" 
                         className="h-6 w-6 ml-auto hover:bg-brand-primary/10 hover:text-red-500"
                         onClick={(e) => {
                            e.preventDefault()
                            setFile(null)
                         }}
                       >
                          <X className="w-3.5 h-3.5" />
                       </Button>
                     </>
                  ) : (
                    <>
                       <Camera className="w-5 h-5 text-slate-400" />
                       <span className="text-xs">Clique para adicionar foto ou vídeo</span>
                    </>
                  )}
              </label>
           </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <Label htmlFor="descricao" className="text-xs font-medium text-slate-600">
            Descrição / Observações
          </Label>
          <Textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Escreva detalhes sobre o que aconteceu..."
            className="min-h-[80px] text-sm bg-white border-slate-200 focus-visible:ring-brand-primary/20 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </Button>
        <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm"
        >
          {isSubmitting ? (
             <>
               <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
               Salvando...
             </>
          ) : (
             "Salvar Registro"
          )}
        </Button>
      </div>
    </form>
  )
}

export function AcaoDossie({ acaoId }: { acaoId: number }) {
  const { dossie, isLoading, error, refetch } = useAcaoHistory(acaoId)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()
  const { isAdmin } = useUserRole()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editableFields, setEditableFields] = useState({
    name: "",
    status: undefined as string | undefined,
    acao: undefined as string | undefined,
    latitude: "",
    longitude: "",
  })

  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    if (dossie) {
      setEditableFields({
        name: dossie.name ?? "",
        status: dossie.status ?? undefined,
        acao: dossie.acao ?? undefined,
        latitude: dossie.latitude ?? "",
        longitude: dossie.longitude ?? "",
      })
    }
  }, [dossie])

  const handleImageClick = (url: string) => {
    setActiveImage(url)
    setIsImageModalOpen(true)
  }

  const handleInputChange = (field: "name" | "latitude" | "longitude") => (event: React.ChangeEvent<HTMLInputElement>) => {
  setEditableFields((prev) => ({
    ...prev,
    [field]: event.target.value,
  }))
}

  const handleSelectChange = (field: "status" | "acao") => (value: string) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCoordinateChange = (field: "latitude" | "longitude") => (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditableFields((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleCancelEdit = () => {
    if (dossie) {
      setEditableFields({
        name: dossie.name ?? "",
        status: dossie.status ?? undefined,
        acao: dossie.acao ?? undefined,
        latitude: dossie.latitude ?? "",
        longitude: dossie.longitude ?? "",
      })
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("name", editableFields.name)
      formData.append("status", editableFields.status ?? "")
      formData.append("acao", editableFields.acao ?? "")
      formData.append("latitude", editableFields.latitude ?? "")
      formData.append("longitude", editableFields.longitude ?? "")
  
      const response = await fetch(`/api/acoes/${acaoId}`, {
        method: "PUT",
        body: formData,
      })

      if (!editableFields.name.trim()) {
    toast({
      title: "Campo obrigatório",
      description: "O nome da ação não pode ficar vazio.",
      variant: "destructive"
    })
    return
  }
  
      const data = await response.json()
  
      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Não foi possível salvar as alterações")
      }
  
      await refetch()
      setIsEditing(false)
      toast({
        title: "Informações atualizadas",
        variant: "success",
        description: "Os dados da ação foram salvos com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!dossie) {
    return <EmptyState />
  }

  const statusDisplayValue = (isEditing ? editableFields.status : dossie.status) || "Sem Status"
  const statusColor = getStatusColor(statusDisplayValue)

  const handleAddSuccess = () => {
    setShowAddForm(false)
    refetch()
  }

  const handleDelete = async (updateId: string) => {
    try {
      const response = await fetch(`/api/acoes/${acaoId}/updates?updateId=${updateId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Erro ao excluir item do histórico")
      }

      toast({
        title: "Item removido",
        variant: "success",
        description: "O registro do histórico foi excluído com sucesso.",
      })

      refetch()
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir este item.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DO DOSSIÊ */}
      <Card className="relative overflow-hidden border-slate-200 xs:rounded-md shadow-sm">
        {/* Barrinha colorida no topo (removed gradient to be cleaner as requested, or keep very subtle) */}
        <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" />
  
        <CardHeader className="pb-4 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              {/* Ícone do dossiê */}
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/5 text-brand-primary flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
  
              <div className="flex-1 min-w-0 space-y-1">
               <CardTitle className="text-base sm:text-lg tracking-tight text-slate-900 flex-1">
                  {isEditing ? (
                    <Input
                      value={editableFields.name}
                      onChange={handleInputChange("name")}
                      className="h-8 font-semibold text-base bg-white border-slate-300 focus-visible:ring-1 focus-visible:ring-sky-500"
                      placeholder="Nome da ação"
                    />
                  ) : (
                    dossie.name
                  )}
                </CardTitle>
                
  
                <div className="flex flex-wrap items-center gap-2">
                  <CardDescription className="text-xs text-slate-500">
                    Dossiê ambiental
                  </CardDescription>
  
                  <Badge
                    variant="outline"
                    className="text-[11px] font-mono px-2 py-0.5 rounded-full border-slate-200 bg-slate-50 text-slate-600"
                  >
                    ID #{acaoId}
                  </Badge>
                  
                </div>
              </div>
            </div>
  
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Badge
                variant="outline"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-[11px] shadow-sm ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}
              >
                {statusColor.icon}
                <span>{statusDisplayValue}</span>
              </Badge>
  
              {isAdmin && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Editar informações
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
  
        <CardContent className="pt-0 pb-4">
          {isEditing ? (
            <div className="grid gap-4 md:grid-cols-2 mt-1">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Status</Label>
                <Select
                  value={editableFields.status || undefined}
                  onValueChange={handleSelectChange("status")}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-50/80 border-slate-200">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
  
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Tipo de Ação</Label>
                <Select
                  value={editableFields.acao || undefined}
                  onValueChange={handleSelectChange("acao")}
                >
                  <SelectTrigger className="h-9 text-sm bg-slate-50/80 border-slate-200">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
  
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Latitude</Label>
                <div className="flex gap-2">
                  <Input
                    value={editableFields.latitude}
                    onChange={handleCoordinateChange("latitude")}
                    placeholder="-21.360685"
                    className="h-9 text-sm bg-slate-50/80 border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    title="Selecionar localização (em breve)"
                  >
                    <LocateFixed className="h-4 w-4" />
                  </Button>
                </div>
              </div>
  
              <div className="space-y-1.5">
                <Label className="text-[11px] text-slate-500">Longitude</Label>
                <div className="flex gap-2">
                  <Input
                    value={editableFields.longitude}
                    onChange={handleCoordinateChange("longitude")}
                    placeholder="-56.596663"
                    className="h-9 text-sm bg-slate-50/80 border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    title="Selecionar localização (em breve)"
                  >
                    <LocateFixed className="h-4 w-4" />
                  </Button>
                </div>
              </div>
  
              <div className="md:col-span-2">
                <DetailItem
                  icon={Calendar}
                  label="Data Criação"
                  value={formatDate(dossie.time || "")}
                />
              </div>
            </div>
          ) : (
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <DetailItem
                icon={Tag}
                label="Tipo de Ação"
                value={dossie.acao || "Sem Tipo de Ação"}
              />
              <DetailItem
                icon={Calendar}
                label="Data Criação"
                value={formatDate(dossie.time || "")}
              />
              <DetailItem
                icon={MapPin}
                label="Latitude"
                value={
                  dossie.latitude
                    ? Number.parseFloat(dossie.latitude).toFixed(6)
                    : "N/A"
                }
              />
              <DetailItem
                icon={MapPin}
                label="Longitude"
                value={
                  dossie.longitude
                    ? Number.parseFloat(dossie.longitude).toFixed(6)
                    : "N/A"
                }
              />
            </div>
          )}
        </CardContent>
      </Card>
  
      <Separator className="bg-slate-200" />

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Histórico
          </h4>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowAddForm(true)}
            className="h-8 text-xs bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Novo Registro
          </Button>
        </div>
        {showAddForm && (
          <div className="mb-4">
            <AddHistoryForm acaoId={acaoId} onSuccess={handleAddSuccess} onCancel={() => setShowAddForm(false)} />
              
          </div>
        )}

        {dossie.history && dossie.history.length > 0 ? <HistoryTimeline history={dossie.history as HistoryUpdate[]} onDelete={handleDelete} onImageClick={handleImageClick} /> : <EmptyState />}
      
        {/* Modal de imagem */}
      {activeImage && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          images={[activeImage]}
          currentIndex={0}
          onNavigate={() => {}}
        />
      )}
      
      </div>
    </div>
  )
}
