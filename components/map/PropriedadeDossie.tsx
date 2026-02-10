"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Map as MapIcon, Tag, Flame, AlertTriangle, Ruler, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"


// Use PropriedadeMap instead of DossieMap
const PropriedadeMap = dynamic(() => import("./PropriedadeMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">Carregando Mapa...</div>
})

interface ActionData {
    id: number;
    name: string;
    categoria: string;
    status: string;
    date: string;
    descricao: string;
    // New fields
    tipo_tecnico?: string;
    carater?: string;
    latitude?: string;
    longitude?: string;
}

interface FocoData {
    id: number;
    date: string;
    latitude: number;
    longitude: number;
    frp?: number;
}

interface DesmatamentoData {
    id: number;
    date: string;
    area: number;
    latitude: number;
    longitude: number;
}

interface PropriedadeData {
    id: number;
    nome: string;
    cod_imovel: string;
    municipio: string;
    num_area: number;
    geojson: any;
    centerLat: number;
    centerLng: number;
    acoes: ActionData[];
    focos: FocoData[];
    desmatamentos: DesmatamentoData[];
    focosCount: number;
    desmatamentoCount: number;
    desmatamentoArea: number;
    areaQueimada: number;
}

export function PropriedadeDossie({ propriedadeId }: { propriedadeId: number }) {
  const [data, setData] = useState<PropriedadeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            if (!propriedadeId) return;
            try {
                const res = await fetch(`/api/propriedades/${propriedadeId}/dossie`)
                const json = await res.json()
                if (json.success) {
                    setData(json.data)
                } else {
                    setError(json.error)
                }
            } catch (err) {
                setError("Falha ao carregar dados")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [propriedadeId])

    const handlePrint = () => {
        window.open(`/print/propriedade/${propriedadeId}`, '_blank');
    }


  if (loading) {
      return (
          <div className="space-y-4 p-4 min-w-[400px]">
              <Skeleton className="h-8 w-3/4" />
              <div className="grid grid-cols-3 gap-2 py-4">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-80 w-full rounded-lg" />
          </div>
      )
  }

  if (error) {
      return (
          <div className="p-8 bg-red-50 text-red-600 rounded-lg flex flex-col items-center justify-center gap-2 text-center">
              <AlertTriangle className="w-10 h-10" />
              <span className="font-bold">Erro ao carregar dossiê</span>
              <span className="text-sm">{error}</span>
          </div>
      )
  }

  if (!data) return null;

  // Use property center or fallback (though PropriedadeMap handles bounds)
  const acoesCount = data.acoes?.length || 0;

  return (
    <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 scrollbar-thin">
        {/* Header */}
        <div className="border-b border-slate-100 pb-6 flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight mb-3 tracking-tight">{data.nome || "Propriedade Sem Nome"}</h2>
                 <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-1 rounded text-slate-700 font-bold" title="Código CAR">
                        {data.cod_imovel || "CAR N/D"}
                    </span>
                    <span className="flex items-center gap-1.5"><MapIcon size={16} className="text-slate-400"/> {data.municipio}</span>
                    <span className="flex items-center gap-1.5"><Ruler size={16} className="text-slate-400"/> {data.num_area?.toFixed(2)} ha</span>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrint} className="bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm">
                <Printer className="w-4 h-4 mr-2" /> Imprimir Relatório
            </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
            <StatCard 
                icon={Tag} 
                label="Ações Realizadas" 
                value={acoesCount} 
                color="text-brand-primary" 
                bg="bg-slate-50 border-slate-200" 
            />
            <StatCard 
                icon={Flame} 
                label="Focos de Calor" 
                value={data.focosCount} 
                subValue={data.areaQueimada > 0 ? `${data.areaQueimada.toFixed(1)} ha` : undefined}
                color="text-red-500" 
                bg="bg-red-50 border-red-100" 
                title="Total histórico de focos e área estimada impactada"
            />
            <StatCard 
                icon={AlertTriangle} 
                label="Alertas Desmate" 
                value={data.desmatamentoCount} 
                subValue={data.desmatamentoArea > 0 ? `${data.desmatamentoArea.toFixed(1)} ha` : undefined}
                color="text-yellow-600" 
                bg="bg-yellow-50 border-yellow-100" 
                title="Total histórico"
            />
        </div>

        {/* Map - Larger Size */}
        <div className="space-y-3">
             <div className="flex justify-between items-end border-b pb-2 border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-brand-primary" />
                    Localização e Ocorrências
                </h3>
             </div>
             <div className="rounded-xl border border-slate-300 overflow-hidden shadow-sm h-[400px] bg-slate-100" style={{ minHeight: '400px' }}>
                <PropriedadeMap
                    propriedadeGeoJson={data.geojson}
                    acoes={data.acoes}
                />
             </div>
             <p className="text-xs text-slate-400 text-center italic">
                O polígono acima representa a área cadastrada no sistema. Pontos indicam ações/incidentes.
             </p>
        </div>

        {/* Actions List */}
        <div className="space-y-4">
            <div className="flex justify-between items-end border-b pb-2 border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-primary" />
                    Detalhamento das Ocorrências
                </h3>
            </div>

            {data.acoes && data.acoes.length > 0 ? (
                <div className="space-y-3">
                    {data.acoes.map((acao) => (
                        <ActionCard key={acao.id} acao={acao} />
                    ))}
                </div>
            ) : (
                <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center">
                    <p className="text-slate-400 font-medium">Nenhuma ação registrada nesta propriedade.</p>
                </div>
            )}
        </div>

        {/* Desmatamento List */}
        {data.desmatamentos && data.desmatamentos.length > 0 && (
             <div className="space-y-4 pt-4">
                <div className="flex justify-between items-end border-b pb-2 border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Histórico de Desmatamento
                    </h3>
                </div>
                <div className="space-y-3">
                    {data.desmatamentos.map((item) => (
                        <DesmatamentoCard key={item.id} data={item} />
                    ))}
                </div>
            </div>
        )}

        {/* Focos List */}
        {data.focos && data.focos.length > 0 && (
             <div className="space-y-4 pt-4">
                <div className="flex justify-between items-end border-b pb-2 border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Flame className="w-4 h-4 text-red-500" />
                        Histórico de Focos de Calor 
                        {data.focosCount > 5 && (
                            <span className="ml-2 text-[10px] font-normal text-slate-500 normal-case bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                Exibindo 5 mais recentes de {data.focosCount}
                            </span>
                        )}
                    </h3>
                </div>
                <div className="space-y-3">
                    {data.focos.map((item) => (
                        <FocoCard key={item.id} data={item} />
                    ))}
                </div>
            </div>
        )}

    </div>
  )
}

function DesmatamentoCard({ data }: { data: DesmatamentoData }) {
    return (
        <div className="rounded-lg shadow-sm border border-l-4 border-yellow-400 bg-white transition hover:shadow-md overflow-hidden">
             <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="font-bold text-slate-800 text-sm">Alerta de Desmatamento</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-yellow-200 text-yellow-700 bg-yellow-50">
                    Monitoramento
                </span>
            </div>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Área Afetada</span>
                        <span className="text-slate-700 font-medium font-mono">{data.area?.toFixed(2)} ha</span>
                    </div>
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Data Detecção</span>
                        <span className="text-slate-700 font-medium font-mono">{new Date(data.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Coordenadas</span>
                        <span className="text-slate-700 font-medium font-mono">
                            {data.latitude && data.longitude ? `${Number(data.latitude).toFixed(4)}, ${Number(data.longitude).toFixed(4)}` : "—"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FocoCard({ data }: { data: FocoData }) {
    return (
        <div className="rounded-lg shadow-sm border border-l-4 border-red-500 bg-white transition hover:shadow-md overflow-hidden">
             <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-600" />
                    <span className="font-bold text-slate-800 text-sm">Foco de Calor</span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-red-200 text-red-700 bg-red-50">
                    Satélite
                </span>
            </div>
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Data Detecção</span>
                        <span className="text-slate-700 font-medium font-mono">{new Date(data.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Intensidade (FRP)</span>
                        <span className="text-slate-700 font-medium font-mono">{data.frp ? data.frp.toFixed(1) : "—"}</span>
                    </div>
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Coordenadas</span>
                        <span className="text-slate-700 font-medium font-mono">
                            {data.latitude && data.longitude ? `${Number(data.latitude).toFixed(4)}, ${Number(data.longitude).toFixed(4)}` : "—"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ActionCard({ acao }: { acao: ActionData }) {
    let borderClass = 'border-l-4 border-slate-300';
    let bgClass = 'bg-white';
    let Icon = Tag;
    let colorClass = 'text-slate-500';

    const cat = (acao.categoria || "").toLowerCase();
    const status = (acao.status || "").toLowerCase();

    if (cat.includes('fiscaliza') || cat.includes('incidente') || status.includes('critico')) {
        borderClass = 'border-l-4 border-red-500';
        bgClass = 'bg-white hover:bg-red-50/10';
        Icon = AlertTriangle;
        colorClass = 'text-red-600';
    } else if (cat.includes('recupera')) {
        borderClass = 'border-l-4 border-green-500';
        bgClass = 'bg-white hover:bg-green-50/10';
        Icon = Tag; 
        colorClass = 'text-green-600';
    } else {
         borderClass = 'border-l-4 border-blue-500';
         colorClass = 'text-blue-600';
    }

    return (
        <div className={`rounded-lg shadow-sm border border-slate-200 ${borderClass} ${bgClass} transition hover:shadow-md overflow-hidden`}>
            {/* Cabecalho do Card */}
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colorClass}`} />
                    <span className="font-bold text-slate-800 text-sm">{acao.name || "Ação Sem Título"}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${colorClass.replace('text-', 'border-').replace('600', '200')} bg-white`}>
                    {acao.categoria || "Geral"}
                </span>
            </div>

            {/* Conteudo */}
            <div className="p-4 space-y-4">
                
                {/* Grid de Detalhes Solicitados: Tipo Técnico, Passivo, Data, Coordenadas */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Tipo Técnico</span>
                        <span className="text-slate-700 font-medium font-mono">{acao.tipo_tecnico || "—"}</span>
                    </div>
                    <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Passivo (Caráter)</span>
                        <span className="text-slate-700 font-medium font-mono">{acao.carater || "—"}</span>
                    </div>
                    <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Data Ocorrência</span>
                        <span className="text-slate-700 font-medium font-mono">{new Date(acao.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                     <div>
                        <span className="block text-slate-400 font-bold uppercase text-[10px] mb-0.5">Coordenadas</span>
                        <span className="text-slate-700 font-medium font-mono" title={`${acao.latitude}, ${acao.longitude}`}>
                            {acao.latitude && acao.longitude ? `${Number(acao.latitude).toFixed(4)}, ${Number(acao.longitude).toFixed(4)}` : "—"}
                        </span>
                    </div>
                </div>

                {/* Descrição */}
                {acao.descricao && (
                    <div className="pt-3 border-t border-slate-100">
                         <span className="block text-slate-400 font-bold uppercase text-[10px] mb-1">Descrição/Observações</span>
                         <p className="text-sm text-slate-600 leading-relaxed text-justify bg-slate-50 p-3 rounded border border-slate-100 italic">
                            "{acao.descricao}"
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}


function StatCard({ icon: Icon, label, value, subValue, color, bg, title }: any) {
    return (
        <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${bg}`} title={title}>
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            <span className="text-2xl font-black text-slate-800 leading-none">{value}</span>
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mt-1">{label}</span>
            {subValue && <span className="text-[10px] text-slate-400 mt-0.5 font-medium bg-white/50 px-1 rounded">{subValue}</span>}
        </div>
    )
}
