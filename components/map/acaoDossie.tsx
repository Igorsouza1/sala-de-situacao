"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useAcaoHistory } from "@/hooks/useAcaoHistory"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Printer, Pencil, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { DossieTemplate, DossieData } from "./dossie-template"

const LoadingState = () => (
  <div className="space-y-6 p-8 max-w-[210mm] mx-auto bg-white min-h-[500px]">
    <div className="flex justify-between items-center mb-10">
      <Skeleton className="h-16 w-16" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-16 w-16" />
    </div>
    <div className="grid grid-cols-4 gap-4 mb-8">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="p-8 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center gap-3 text-red-700">
    <AlertCircle className="w-6 h-6" />
    <span className="font-semibold">{message}</span>
  </div>
)

// --- COMPONENT PRINCIPAL ---
export function AcaoDossie({ acaoId }: { acaoId: number }) {
  const { dossie, isLoading, error, refetch } = useAcaoHistory(acaoId)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  // --- HANDLERS ---
  const handlePrint = () => {
    // ROTINA DE IMPRESSÃO DEDICADA ("THE NUCLEAR OPTION")
    // Abre a rota de impressão em nova aba
    window.open(`/print/dossie/${acaoId}`, '_blank')
  }

  const handleUpdateFields = async (formData: FormData) => {
    try {
        setIsSubmitting(true)
        const res = await fetch(`/api/acoes/${acaoId}`, {
            method: 'PUT',
            body: formData
        })
        const data = await res.json()
        
        if (data.success) {
            toast({ title: "Sucesso", description: "Dados atualizados com sucesso." })
            refetch()
            setIsEditing(false)
        } else {
            throw new Error(data.error || "Erro ao atualizar")
        }
    } catch (e: any) {
        toast({ variant: "destructive", title: "Erro", description: e.message })
    } finally {
        setIsSubmitting(false)
    }
  }

  const handleDeleteHistory = async (id: string) => {
      // The id might come as "foto-123" or just "123". Check logic.
      // acoesService.deleteAcaoUpdateById expects number.
      // The API expects ?updateId=number
      // We assume id is numeric or parseable.
      try {
          // If id has prefix, strip it (assuming implementation in DossieTemplate ensures valid ID for API)
          const numericId = id.replace(/\D/g, '')
          
          const res = await fetch(`/api/acoes/${acaoId}/updates?updateId=${numericId}`, {
              method: 'DELETE'
          })
          const data = await res.json()
           if (data.success) {
            toast({ title: "Sucesso", description: "Registro excluído." })
            refetch()
           } else {
            throw new Error(data.error || "Erro ao excluir")
           }
      } catch (e: any) {
           toast({ variant: "destructive", title: "Erro", description: e.message })
      }
  }

  const handleAddHistory = async (input: { descricao: string, file?: File }) => {
      try {
          setIsSubmitting(true)
          let urlMidia = null

          // 1. Upload logic if file exists
          if (input.file) {
             // Get Upload URL
             const resUrl = await fetch(`/api/acoes/${acaoId}/upload-url`, {
                 method: 'POST',
                 body: JSON.stringify({ fileName: input.file.name })
             })
             const urlData = await resUrl.json()
             if (!urlData.success) throw new Error(urlData.error || "Erro ao gerar URL de upload")
             
             const { uploadUrl, blobUrl } = urlData.data

             // Upload File to Azure
             const uploadRes = await fetch(uploadUrl, {
                 method: 'PUT',
                 body: input.file,
                 headers: {
                     'x-ms-blob-type': 'BlockBlob',
                     // 'Content-Type': input.file.type // Often optional or required depending on SAS config
                 }
             })
             
             if (!uploadRes.ok) throw new Error("Falha no upload da imagem")
             
             urlMidia = blobUrl
          }

          // 2. Add Update Record
          const res = await fetch(`/api/acoes/${acaoId}/updates`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  descricao: input.descricao,
                  urlMidia: urlMidia
              })
          })
          const data = await res.json()

          if (data.success) {
            toast({ title: "Sucesso", description: "Novo registro adicionado." })
            refetch()
          } else {
            throw new Error(data.error || "Erro ao salvar registro")
          }

      } catch (e: any) {
        toast({ variant: "destructive", title: "Erro", description: e.message })
      } finally {
        setIsSubmitting(false)
      }
  }

    // --- RENDER ---

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!dossie) return <div className="p-8 text-center text-slate-500">Dossiê não encontrado.</div>

  return (
    <div className="min-h-screen bg-slate-100/50 py-8">
      
      {/* Container A4 Style Actions */}
      <div className="mx-auto max-w-[210mm] w-full mb-4 flex items-center justify-between no-print">
         <div className="flex gap-2">
            <Button 
                variant={isEditing ? "default" : "outline"} 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)} 
                className={isEditing ? "bg-brand-primary text-white" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"}
                disabled={isSubmitting}
            >
                {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
                {isEditing ? "Concluir Edição" : "Editar"}
            </Button>
         </div>

         <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Imprimir
         </Button>
      </div>

      <DossieTemplate 
        dossie={dossie as unknown as DossieData} 
        isEditing={isEditing}
        onUpdateFields={handleUpdateFields}
        onDeleteHistory={handleDeleteHistory}
        onAddHistory={handleAddHistory}
      />

    </div>
  )
}
