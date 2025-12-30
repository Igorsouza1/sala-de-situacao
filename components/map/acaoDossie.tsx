"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { useAcaoHistory } from "@/hooks/useAcaoHistory"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Printer } from "lucide-react"
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
  const { dossie, isLoading, error } = useAcaoHistory(acaoId)
  
  // --- HANDLERS ---
  const handlePrint = () => {
    // ROTINA DE IMPRESSÃO DEDICADA ("THE NUCLEAR OPTION")
    // Abre a rota de impressão em nova aba
    window.open(`/print/dossie/${acaoId}`, '_blank')
  }

    // --- RENDER ---

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={error} />
  if (!dossie) return <div className="p-8 text-center text-slate-500">Dossiê não encontrado.</div>

  return (
    <div className="min-h-screen bg-slate-100/50 py-8">
      
      {/* Container A4 Style Actions */}
      <div className="mx-auto max-w-[210mm] w-full mb-4 flex items-center justify-between">
         <h2 className="text-lg font-bold text-slate-800">Detalhes da Camada</h2>
         <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300">
            <Printer className="w-4 h-4 mr-2" /> Imprimir Dossiê
         </Button>
      </div>

      <DossieTemplate dossie={dossie as unknown as DossieData} />

    </div>
  )
}
