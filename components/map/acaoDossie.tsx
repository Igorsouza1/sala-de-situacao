"use client"

import type React from "react"

import { useAcaoHistory } from "@/hooks/useAcaoHistory"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/helpers/formatter/formatDate"
import { MapPin, Calendar, Tag, Camera, PlusCircle, AlertCircle, CheckCircle2, Clock } from "lucide-react"

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

const getStatusColor = (status: string): { bg: string; text: string; icon: React.ReactNode } => {
  const normalizedStatus = status?.toLowerCase() || ""

  if (normalizedStatus.includes("concluído") || normalizedStatus.includes("ativo")) {
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      icon: <CheckCircle2 className="w-4 h-4" />,
    }
  }
  if (normalizedStatus.includes("pendente") || normalizedStatus.includes("aguardando")) {
    return {
      bg: "bg-amber-100",
      text: "text-amber-800",
      icon: <Clock className="w-4 h-4" />,
    }
  }
  if (normalizedStatus.includes("erro") || normalizedStatus.includes("cancelado")) {
    return {
      bg: "bg-red-100",
      text: "text-red-800",
      icon: <AlertCircle className="w-4 h-4" />,
    }
  }

  return {
    bg: "bg-slate-100",
    text: "text-slate-800",
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

const ImageDisplay = ({ src, alt }: { src: string; alt: string }) => (
  <img
    src={src || "/placeholder.svg"}
    alt={alt}
    className="w-full h-48 object-cover rounded-lg border border-slate-200"
  />
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

const HistoryTimeline = ({ history }: { history: HistoryUpdate[] }) => (
  <div className="space-y-4">
    {history.map((update, index) => (
      <div key={update.id} className="flex gap-4">
        {/* Timeline connector */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
            {update.tipoUpdate === "midia" ? (
              <Camera className="w-5 h-5 text-blue-600" />
            ) : (
              <PlusCircle className="w-5 h-5 text-blue-600" />
            )}
          </div>
          {index < history.length - 1 && <div className="w-0.5 h-12 bg-slate-200 mt-2" />}
        </div>

        {/* Content */}
        <div className="flex-1 pb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {update.tipoUpdate === "criacao" ? "📝 Ação Criada" : "📸 Foto Adicionada"}
          </p>
          <p className="text-xs text-slate-500 mb-3">{formatDate(update.timestamp || "")}</p>

          {/* Imagem */}
          {update.tipoUpdate === "midia" && update.urlMidia && (
            <div className="space-y-2 mb-3">
              <ImageDisplay src={update.urlMidia || "/placeholder.svg"} alt="Mídia do dossiê" />
              {update.descricao && (
                <p className="text-sm text-slate-700 italic px-3 py-2 bg-slate-50 rounded-lg border-l-2 border-blue-300">
                  "{update.descricao}"
                </p>
              )}
            </div>
          )}

          {/* Descrição de Criação */}
          {update.tipoUpdate === "criacao" && update.descricao && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-slate-800">{update.descricao}</p>
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
)

export function AcaoDossie({ acaoId }: { acaoId: number }) {
  const { dossie, isLoading, error } = useAcaoHistory(acaoId)

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  if (!dossie) {
    return <EmptyState />
  }

  const statusColor = getStatusColor(dossie.status || 'Sem Status')

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-slate-900">{dossie.name}</h3>
            <p className="text-xs text-slate-600 mt-1">ID: {acaoId}</p>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-full font-semibold text-sm flex-shrink-0 whitespace-nowrap ${statusColor.bg} ${statusColor.text}`}
          >
            {statusColor.icon}
            <span>{dossie.status || "Sem Status"}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <DetailItem icon={Tag} label="Tipo de Ação" value={dossie.acao || "Sem Tipo de Ação"} />
          <DetailItem icon={Calendar} label="Data Criação" value={formatDate(dossie.time || "")} />
          <DetailItem
            icon={MapPin}
            label="Latitude"
            value={dossie.latitude ? Number.parseFloat(dossie.latitude).toFixed(6) : "N/A"}
          />
          <DetailItem
            icon={MapPin}
            label="Longitude"
            value={dossie.longitude ? Number.parseFloat(dossie.longitude).toFixed(6) : "N/A"}
          />
        </div>
      </div>

      <hr className="border-slate-200" />

      <div>
        <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Histórico do Dossiê
        </h4>

        {dossie.history && dossie.history.length > 0 ? <HistoryTimeline history={dossie.history as HistoryUpdate[]} /> : <EmptyState />}
      </div>
    </div>
  )
}
