"use client"

import { useEffect, useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { formatDate } from "@/lib/helpers/formatter/formatDate"
import { ImageModal } from "@/components/ui/image-modal"
import { AlertCircle, Printer, Trash, Plus, Save, FileImage, X } from "lucide-react" 
import { Button } from "@/components/ui/button" 
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ACTION_CATEGORIES, STATUS_STYLES, ActionCategory, ActionStatus } from "./config/actions-config"

// --- Dynamic Imports for Map ---
const DossieMap = dynamic(() => import("./dossie-map"), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">Carregando Mapa...</div>
})

export interface HistoryUpdate {
  id: string
  tipoUpdate: "criacao" | "midia"
  timestamp?: string
  descricao?: string
  urlMidia?: string
}

export interface DossieData {
  name: string
  acao: string
  status: string
  time?: string
  tipo?: string
  propriedade?: string
  propriedadeCodigo?: string
  latitude?: string
  longitude?: string
  history: HistoryUpdate[]
  propriedadeGeoJson?: any
  banhadoGeoJson?: any
  tipo_tecnico?: string
}

const getStatusColor = (status: string) => {
  const normalizedStatus = status
    ? status.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    : ""

  if (normalizedStatus.includes("concluido") || normalizedStatus.includes("ativo")) {
    return { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" }
  }
  if (normalizedStatus.includes("monitoramento") || normalizedStatus.includes("pendente")) {
    return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" }
  }
  if (normalizedStatus.includes("identificado")) {
    return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" }
  }
  return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200" }
}

interface DossieTemplateProps {
  dossie: DossieData
  isPrintMode?: boolean
  isEditing?: boolean
  onUpdateFields?: (formData: FormData) => Promise<void>
  onDeleteHistory?: (id: string) => Promise<void>
  onAddHistory?: (input: { descricao: string, file?: File }) => Promise<void>
}

export function DossieTemplate({ 
  dossie, 
  isPrintMode = false,
  isEditing = false,
  onUpdateFields,
  onDeleteHistory,
  onAddHistory
}: DossieTemplateProps) {
  // Image Modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Edit States for Fields
  const [editStatus, setEditStatus] = useState(dossie?.status || "")
  const [editCategory, setEditCategory] = useState(dossie?.tipo_tecnico || "")
  const [editType, setEditType] = useState(dossie?.tipo || "")

  // New Record State
  const [newRecordDesc, setNewRecordDesc] = useState("")
  const [newRecordFile, setNewRecordFile] = useState<File | null>(null)

  useEffect(() => {
     if(dossie) {
        setEditStatus(dossie.status || "")
        setEditCategory(dossie.acao || "")
        setEditType(dossie.tipo || "")
     }
  }, [dossie])

  const images = useMemo(() => {
    return dossie?.history?.filter((h) => h.urlMidia).map((h) => h.urlMidia!) || []
  }, [dossie])

  const handleImageClick = (url: string) => {
    if (isPrintMode) return // No interaction in print mode
    const idx = images.indexOf(url)
    if (idx >= 0) {
      setCurrentImageIndex(idx)
      setIsImageModalOpen(true)
    }
  }

  const handleSaveFields = async () => {
     if (!onUpdateFields) return
     const formData = new FormData()
     formData.append('status', editStatus)
     formData.append('acao', editCategory) // 'acao' is category in DB column
     formData.append('tipo', editType)
     await onUpdateFields(formData)
  }

  const handleAddNewRecord = async () => {
      if (!onAddHistory) return
      if (!newRecordDesc && !newRecordFile) return // Need at least one

      await onAddHistory({
          descricao: newRecordDesc,
          file: newRecordFile || undefined
      })
      // Reset form
      setNewRecordDesc("")
      setNewRecordFile(null)
  }

  // Auto-print logic
  useEffect(() => {
    if (isPrintMode) {
      // Small delay to ensure maps are loaded (?) - hard to guarantee with Leaflet but valid attempt
      const timer = setTimeout(() => {
        window.print()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isPrintMode])

  
  if (!dossie) return <div className="p-8 text-center text-slate-500">Dossiê não disponível.</div>

  const statusStyle = getStatusColor(dossie.status || "")
  const lat = Number(dossie.latitude)
  const lng = Number(dossie.longitude)
  const hasCoordinates = !isNaN(lat) && !isNaN(lng)

  return (
    <div className={`min-h-screen bg-white ${!isPrintMode ? "bg-slate-100/50 py-8" : "p-0"}`}>
       <style jsx global>{`
        @media print {
          @page { 
            size: A4; 
            margin: 0; 
          }
          
          html, body {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }

          /* Hide everything by default */
          body * {
            visibility: hidden;
          }

          /* Only show the dossier */
          #printable-dossier, #printable-dossier * {
            visibility: visible;
          }

          #printable-dossier {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            min-height: 100vh;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            display: block !important;
            overflow: visible !important;
          }

          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
           
           /* Hide non-print elements inside the component if any leak through */
           .print\:hidden {
             display: none !important;
           }
           
           .no-print {
               display: none !important;
           }

           /* Fix leaflet print bug where map overlays document */
           .leaflet-container {
             z-index: 0 !important;
           }
        }
      `}</style>


      <div id="printable-dossier" className="mx-auto max-w-[210mm] w-full bg-white shadow-xl print:shadow-none print:w-full flex flex-col min-h-[297mm]">
        
        {/* --- A. CABEÇALHO INSTITUCIONAL --- */}
        <header className="px-10 py-8 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50 print:bg-white">
           {/* Esquerda: Brasão Bonito */}
           <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src="/brasao-bonito.jpeg" 
                alt="Brasão Bonito" 
                className="max-h-full max-w-full object-contain opacity-90"
              />
           </div>

           {/* Centro: Título Oficial */}
           <div className="text-center space-y-1 flex-1 px-4">
              <h1 className="text-xl font-black tracking-widest text-slate-900 uppercase font-serif">
                Relatório de Ação e<br/>Prevenção Ambiental
              </h1>
              <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">
                Sala de Situação • Município de Bonito/MS
              </p>
           </div>

           {/* Direita: Logo Governo MS */}
            <div className="w-24 h-24 flex items-center justify-center">
              <img 
                src="/prisma_logo_revert.png" 
                alt="PRISMA" 
                className="max-h-full max-w-full object-contain"
              />
           </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 px-10 py-8 space-y-8">

           {/* --- B. METADADOS DE AUDITORIA (GRID) --- */}
           <section aria-label="Dados da Ocorrência">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2">
                   01. Dados da Ocorrência
                 </h2>
                 {isEditing && (
                     <Button size="sm" onClick={handleSaveFields} className="h-6 text-xs bg-brand-primary text-white">Salvar Alterações</Button>
                 )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 border border-slate-900 text-sm">
                 {/* ID */}
                 <div className="p-3 border-r border-b border-slate-900 bg-slate-50">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">ID da Ocorrência</span>
                    <span className="font-mono font-bold text-lg text-slate-900">#{(dossie as any).id || (dossie as any).acaoId || "N/A"}</span>
                 </div>
                 
                 {/* Data/Hora */}
                 <div className="p-3 border-r border-b border-slate-900">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data de Registro</span>
                    <span className="font-medium text-slate-900">{formatDate(dossie.time || "")}</span>
                 </div>

                 {/* Status */}
                 <div className={`p-3 border-b border-slate-900 flex flex-col justify-center ${statusStyle.bg}`}>
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status Atual</span>
                    {isEditing ? (
                        <select 
                            className="w-full p-1 text-xs border border-slate-300 rounded bg-white text-slate-900"
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                        >
                            {Object.keys(STATUS_STYLES).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    ) : (
                        <span className={`font-black uppercase tracking-wide ${statusStyle.text}`}>
                        {dossie.status || "DESCONHECIDO"}
                        </span>
                    )}
                 </div>

                 {/* Categoria (Natureza) */}
                 <div className="p-3 border-r border-slate-900">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Categoria</span>
                    {isEditing ? (
                        <select 
                            className="w-full p-1 text-xs border border-slate-300 rounded bg-white text-slate-900 uppercase"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                        >
                            {Object.keys(ACTION_CATEGORIES).map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    ) : (
                        <span className="font-semibold text-slate-900 uppercase">{dossie.tipo_tecnico || "Não listado"}</span>
                    )}
                 </div>

                 {/* Tipo (Detalhe) */}
                 <div className="p-3 border-r border-slate-900 bg-slate-50">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo</span>
                    {isEditing ? (
                        <Input 
                            className="h-7 text-xs bg-white" 
                            value={editType} 
                            onChange={(e) => setEditType(e.target.value)} 
                        />
                    ) : (
                        <span className="font-semibold text-slate-900 uppercase">{dossie.tipo || "—"}</span>
                    )}
                 </div>

                 {/* Propriedade */}
                 <div className="p-3 border-slate-900">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Propriedade Local</span>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 uppercase truncate" title={dossie.propriedade || ""}>
                            {dossie.propriedade || "Nome não informado"}
                        </span>
                        {dossie.propriedadeCodigo && (
                            <span className="text-[10px] font-mono text-slate-500 mt-1" title="Cadastro Ambiental Rural">
                                CAR: {dossie.propriedadeCodigo}
                            </span>
                        )}
                    </div>
                 </div>
              </div>
           </section>

            {/* --- C. CONTEXTO GEOGRÁFICO (MINI MAPA) --- */}
            {hasCoordinates && (
                <section aria-label="Localização Geográfica" className="break-inside-avoid">
                     <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2 mb-4">
                        02. Localização Geográfica
                     </h2>
                     
                     <div className="border border-slate-300 bg-slate-100 p-1 rounded-sm shadow-sm print:shadow-none">
                        <DossieMap 
                           lat={lat} 
                           lng={lng} 
                           propriedadeGeoJson={dossie.propriedadeGeoJson} 
                           banhadoGeoJson={dossie.banhadoGeoJson} 
                        />
                     </div>
                </section>
            )}

            {/* --- E. NARRATIVA TÉCNICA (CONTEXTO) & D. IMAGENS --- */}
            <section aria-label="Histórico e Evidências" className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2">
                        03. Relatório Técnico & Evidências
                    </h2>
                 </div>

                 {/* Form de Adição (Apenas Modo Edição) */}
                 {isEditing && (
                     <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 no-print mb-6">
                        <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Adicionar Novo Registro
                        </h3>
                        <div className="grid gap-4">
                            <Textarea 
                                placeholder="Descreva a atualização técnica..." 
                                className="bg-white text-sm"
                                value={newRecordDesc}
                                onChange={(e) => setNewRecordDesc(e.target.value)}
                            />
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold text-slate-500 border border-slate-300 rounded px-3 py-2 bg-white hover:bg-slate-50 transition-colors">
                                        <FileImage className="w-4 h-4" />
                                        {newRecordFile ? truncate(newRecordFile.name, 20) : "Anexar Evidência (Imagem)"}
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setNewRecordFile(e.target.files[0])
                                                }
                                            }}
                                        />
                                    </label>
                                    {newRecordFile && (
                                        <button onClick={() => setNewRecordFile(null)} className="ml-2 text-slate-400 hover:text-red-500">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <Button size="sm" onClick={handleAddNewRecord} disabled={!newRecordDesc && !newRecordFile}>
                                    Adicionar Registro
                                </Button>
                            </div>
                        </div>
                     </div>
                 )}

                 {dossie.history && dossie.history.length > 0 ? (
                    <div className="space-y-8">
                       {dossie.history.map((item, idx) => (
                          <div key={item.id} className="break-inside-avoid relative group">
                             
                             {/* Delete Button (Edit Mode Only) */}
                             {isEditing && onDeleteHistory && (
                                 <button 
                                    onClick={() => onDeleteHistory(item.id)}
                                    className="absolute -left-8 top-0 text-slate-300 hover:text-red-500 p-1 no-print"
                                    title="Excluir Registro"
                                 >
                                    <Trash className="w-4 h-4" />
                                 </button>
                             )}

                             {/* Cabeçalho do Item */}
                             <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-1">
                                <span className="font-mono text-xs font-bold text-slate-400">#{idx + 1}</span>
                                <span className="text-xs font-bold uppercase text-slate-700">
                                   Reg. em {formatDate(item.timestamp || "")}
                                </span>
                                <span className="ml-auto text-[10px] text-slate-400 uppercase tracking-widest">
                                    {item.tipoUpdate}
                                </span>
                             </div>

                             <div className="pl-4 border-l-2 border-slate-200 space-y-4">
                                {/* Parecer Técnico (Texto) */}
                                {item.descricao && (
                                   <div className="font-serif text-justify text-slate-800 leading-relaxed text-sm bg-slate-50 p-4 border border-slate-100 rounded-lg print:border-none print:p-0 print:bg-transparent">
                                      {item.descricao}
                                   </div>
                                )}

                                {/* Evidência Visual (Imagem) */}
                                {item.urlMidia && (
                                   <div className="mt-2 w-full max-w-md">
                                      {isPrintMode ? (
                                         <div className="relative border-2 border-slate-900 bg-slate-100">
                                            <img 
                                              src={item.urlMidia} 
                                              alt="Evidência" 
                                              className="w-full h-auto object-cover max-h-80"
                                            />
                                            {/* Carimbo de Tempo na Imagem (Simulado Visualmente) */}
                                            <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] font-mono px-2 py-1">
                                                {formatDate(item.timestamp || "")}
                                            </div>
                                         </div>
                                      ) : (
                                        <div 
                                          className="relative group/img cursor-pointer border-2 border-slate-900 bg-slate-100"
                                          onClick={() => handleImageClick(item.urlMidia!)}
                                        >
                                            <img 
                                              src={item.urlMidia} 
                                              alt="Evidência" 
                                              className="w-full h-auto object-cover max-h-80"
                                            />
                                            <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] font-mono px-2 py-1">
                                                {formatDate(item.timestamp || "")}
                                            </div>
                                        </div>
                                      )}
                                      <p className="text-[10px] text-slate-500 mt-1 italic text-center">
                                         Fig. {idx + 1} - Evidência fotográfica registrada in loco.
                                      </p>
                                   </div>
                                )}
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="p-8 border border-dashed border-slate-300 text-center text-slate-500 italic font-serif">
                       Nenhum registro técnico adicionado a este dossiê até o momento.
                    </div>
                 )}
            </section>

        </main>

        {/* --- RODAPÉ --- */}
        <footer className="mt-auto px-10 py-6 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
               Sistema de Monitoramento Ambiental - PRISMA • Documento gerado eletronicamente
            </p>
        </footer>

      </div>

      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        images={images}
        currentIndex={currentImageIndex}
        onNavigate={setCurrentImageIndex}
      />
    </div>
  )
}

function truncate(str: string, length: number) {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}
