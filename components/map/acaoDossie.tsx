// components/map/AcaoDossie.tsx
"use client"

import { useAcaoHistory } from "@/hooks/useAcaoHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { DetailItem } from "@/components/ui/detail-Item";
import { ImageCarousel } from "@/components/ui/image-carousel";
import { formatDate } from "@/lib/helpers/formatter/formatDate";
import { MapPin, Calendar, Tag, FileText, MessageSquare, Camera, PlusCircle } from "lucide-react";

export function AcaoDossie({ acaoId }: { acaoId: number }) {
  const { dossie, isLoading, error } = useAcaoHistory(acaoId);

  // ---- RENDERIZAÇÃO DO HISTÓRICO (timeline) ----
  const renderHistory = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      );
    }
    
    if (error) {
      return <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>;
    }
    
    if (!dossie || !dossie.history || dossie.history.length === 0) {
       return <div className="text-gray-600 p-4 bg-gray-50 rounded-lg text-center">Nenhum histórico de atualização encontrado.</div>;
    }
    
    // Usando seu schema de dados
    return (
        <div className="space-y-6">
            {dossie.history.map(update => (
                <div key={update.id} className="flex gap-3">
                    {/* Ícone do Tipo de Update */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pantaneiro-lime/20 flex items-center justify-center">
                        {update.tipoUpdate === 'midia' ? <Camera className="w-4 h-4 text-pantaneiro-green"/> : <PlusCircle className="w-4 h-4 text-pantaneiro-green"/>}
                    </div>
                    
                    {/* Conteúdo do Update */}
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">
                            {update.tipoUpdate === 'criacao' ? 'Ação criada em' : 'Foto adicionada em'} {formatDate(update.timestamp || '')}
                        </p>
                        
                        {/* Se for Mídia, mostra a imagem */}
                        {update.tipoUpdate === 'midia' && update.urlMidia && (
                            <div className="space-y-2">
                                <ImageCarousel images={[update.urlMidia]} />
                                {update.descricao && <p className="text-sm text-gray-700 italic mt-2">"{update.descricao}"</p>}
                            </div>
                        )}

                        {/* Se for Criação, mostra a descrição original */}
                        {update.tipoUpdate === 'criacao' && update.descricao && (
                             <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-800">{update.descricao}</p>
                             </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
  }

  // ---- DADOS PRINCIPAIS (fixos no topo) ----
  if (isLoading || !dossie) {
     return (
        <div className="space-y-4">
            <div className="space-y-2 mb-6 p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" /> <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <hr/>
            <Skeleton className="h-8 w-1/3 mt-4" />
            <Skeleton className="h-24 w-full" />
        </div>
     );
  }

  // Renderização principal
  return (
    <div className="space-y-6">
      {/* Dados Principais */}
      <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-lg text-gray-900">{dossie.name}</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailItem icon={Tag} label="Tipo" value={dossie.acao} />
          <DetailItem icon={Calendar} label="Data Criação" value={formatDate(dossie.time || '')} />
          <DetailItem icon={MapPin} label="Latitude" value={parseFloat(dossie.latitude!).toFixed(6)} />
          <DetailItem icon={MapPin} label="Longitude" value={parseFloat(dossie.longitude!).toFixed(6)} />
        </div>
      </div>
      
      <hr />
      
      {/* Histórico */}
      <h4 className="text-lg font-semibold text-gray-800 mt-4">Histórico do Dossiê</h4>
      {renderHistory()}
    </div>
  )
}