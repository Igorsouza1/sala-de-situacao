"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { Map, Tag, Flame, AlertTriangle, Ruler, MapPin } from "lucide-react"

// Dynamic Import for Map (Client Only)
const PropriedadeMap = dynamic(() => import("./PropriedadeMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Carregando Mapa...</div>
})

export interface PropriedadeData {
    id: number;
    nome: string;
    cod_imovel: string;
    municipio: string;
    num_area: number;
    geojson: any;
    centerLat: number;
    centerLng: number;
    acoes: any[];
    focos?: any[];
    desmatamentos?: any[];
    focosCount: number;
    desmatamentoCount: number;
    desmatamentoArea: number;
    areaQueimada: number;
}

interface PropriedadeDossieTemplateProps {
    data: PropriedadeData;
    isPrintMode?: boolean;
}

export function PropriedadeDossieTemplate({ data, isPrintMode = false }: PropriedadeDossieTemplateProps) {

    // Auto-print logic
    useEffect(() => {
        if (isPrintMode) {
            // Small delay to ensure map renders
            const timer = setTimeout(() => {
                window.print()
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [isPrintMode])

    if (!data) return null;

    return (
        <div className={`min-h-screen bg-white ${!isPrintMode ? "bg-slate-100/50 py-8" : "p-0"}`}>
             <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    html, body { background: white !important; height: auto !important; overflow: visible !important; }
                    body * { visibility: hidden; }
                    #printable-propriedade, #printable-propriedade * { visibility: visible; }
                    #printable-propriedade {
                        position: absolute; left: 0; top: 0; width: 210mm !important; min-height: 100vh;
                        margin: 0 !important; padding: 0 !important; display: block !important;
                    }
                    .no-print { display: none !important; }
                    .leaflet-container { z-index: 0 !important; }
                    .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
                }
            `}</style>
            
            <div id="printable-propriedade" className="mx-auto max-w-[210mm] w-full bg-white shadow-xl print:shadow-none flex flex-col min-h-[297mm]">
                
                {/* --- HEADER --- */}
                <header className="px-10 py-8 border-b-4 border-slate-900 flex items-center justify-between bg-slate-50 print:bg-white">
                    <div className="w-24 h-24 flex items-center justify-center">
                        <img src="/brasao-bonito.jpeg" 
                             alt="Brasão" className="max-h-full max-w-full object-contain opacity-90" />
                    </div>
                    <div className="text-center space-y-1 flex-1 px-4">
                        <h1 className="text-xl font-black tracking-widest text-slate-900 uppercase font-serif">
                            Relatório de Propriedade<br/>e Monitoramento
                        </h1>
                        <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-1">
                            Sala de Situação • Município de Bonito/MS
                        </p>
                    </div>
                    <div className="w-24 h-24 flex items-center justify-center">
                        <img src="/prisma_logo_revert.png" alt="PRISMA" className="max-h-full max-w-full object-contain" />
                    </div>
                </header>

                <main className="flex-1 px-10 py-8 space-y-8">
                    
                    {/* --- 1. IDENTIFICAÇÃO --- */}
                    <section aria-label="Identificação">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2 mb-4">
                            01. Identificação do Imóvel
                        </h2>
                        <div className="grid grid-cols-2 border border-slate-900 text-sm">
                            <div className="p-3 border-r border-b border-slate-900 bg-slate-50">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome do Imóvel</span>
                                <span className="font-bold text-lg text-slate-900 uppercase">{data.nome || "Não Informado"}</span>
                            </div>
                            <div className="p-3 border-b border-slate-900">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Município</span>
                                <span className="font-medium text-slate-900 uppercase">{data.municipio}</span>
                            </div>
                            <div className="p-3 border-r border-slate-900">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código CAR</span>
                                <span className="font-mono text-slate-900">{data.cod_imovel || "—"}</span>
                            </div>
                            <div className="p-3 border-slate-900 bg-slate-50">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Área Total</span>
                                <span className="font-mono text-slate-900">{data.num_area?.toFixed(2)} ha</span>
                            </div>
                        </div>
                    </section>
                    
                    {/* --- 2. INDICADORES --- */}
                    <section aria-label="Indicadores">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2 mb-4">
                            02. Indicadores de Monitoramento
                        </h2>
                        <div className="grid grid-cols-3 gap-4">
                            <PrintStatCard label="Ações Realizadas" value={data.acoes?.length || 0} icon={Tag} />
                            <PrintStatCard label="Focos de Calor" value={data.focosCount} sub={`${data.areaQueimada?.toFixed(1) || 0} ha`} icon={Flame} alert={data.focosCount > 0} />
                            <PrintStatCard label="Alertas Desmate" value={data.desmatamentoCount} sub={`${data.desmatamentoArea?.toFixed(1) || 0} ha`} icon={AlertTriangle} alert={data.desmatamentoCount > 0} />
                        </div>
                    </section>

                    {/* --- 3. MAPA --- */}
                    <section aria-label="Mapa" className="break-inside-avoid">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2 mb-4">
                            03. Contexto Espacial
                        </h2>
                        <div className="border border-slate-300 bg-slate-100 p-1 h-[350px]">
                             <PropriedadeMap propriedadeGeoJson={data.geojson} acoes={data.acoes} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                            Delimitação: SIRGAS 2000. Fonte: SisFlora/CAR + Monitoramento Satoc.
                        </p>
                    </section>

                {/* --- 4. LISTA DE AÇÕES --- */}
                    <section aria-label="Ações" className="space-y-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-l-4 border-brand-primary pl-2">
                             04. Detalhamento de Ocorrências e Alertas
                        </h2>
                        
                        {/* AÇÕES */}
                        {data.acoes && data.acoes.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <h3 className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">Ações de Campo</h3>
                                {data.acoes.map((acao, idx) => (
                                    <div key={idx} className="break-inside-avoid border border-slate-200 rounded-lg p-4 bg-slate-50">
                                        <div className="flex justify-between items-start mb-2 border-b border-slate-200 pb-2">
                                            <div>
                                                <span className="text-xs font-bold uppercase text-brand-primary block">{acao.name || "Ação"}</span>
                                                <span className="text-[10px] text-slate-500 uppercase">{acao.categoria} • {acao.status}</span>
                                            </div>
                                            <span className="font-mono text-xs text-slate-400">{new Date(acao.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 text-xs gap-2 mb-2">
                                            <div><span className="font-bold text-slate-500">Tipo Técnico:</span> {acao.tipo_tecnico || "—"}</div>
                                            <div><span className="font-bold text-slate-500">Caráter:</span> {acao.carater || "—"}</div>
                                            <div><span className="font-bold text-slate-500">Coords:</span> {acao.latitude}, {acao.longitude}</div>
                                        </div>
                                        {acao.descricao && (
                                            <p className="text-xs text-slate-700 italic border-l-2 border-slate-300 pl-2 mt-2">
                                                "{acao.descricao}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* DESMATAMENTO */}
                        {data.desmatamentos && data.desmatamentos.length > 0 && (
                            <div className="space-y-4 mb-6">
                                <h3 className="text-xs font-bold text-yellow-700 uppercase border-b border-slate-200 pb-1 flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Alertas de Desmatamento
                                </h3>
                                {data.desmatamentos.map((item: any, idx: number) => (
                                    <div key={idx} className="break-inside-avoid border-l-4 border-yellow-400 bg-white rounded shadow-sm p-3 text-xs">
                                         <div className="flex justify-between font-bold text-slate-700 mb-2">
                                            <span>ALERTA DE DESMATAMENTO</span>
                                            <span className="font-mono">{new Date(item.date).toLocaleDateString()}</span>
                                         </div>
                                         <div className="grid grid-cols-2 gap-2 text-slate-600">
                                            <div><span className="font-bold">Área:</span> {item.area?.toFixed(2)} ha</div>
                                            <div><span className="font-bold">Coords:</span> {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* FOCOS */}
                        {data.focos && data.focos.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-red-700 uppercase border-b border-slate-200 pb-1 flex items-center gap-2">
                                    <Flame className="w-3 h-3" /> Focos de Calor
                                </h3>
                                {data.focos.map((item: any, idx: number) => (
                                    <div key={idx} className="break-inside-avoid border-l-4 border-red-500 bg-white rounded shadow-sm p-3 text-xs">
                                         <div className="flex justify-between font-bold text-slate-700 mb-2">
                                            <span>FOCO DE CALOR (Satélite)</span>
                                            <span className="font-mono">{new Date(item.date).toLocaleDateString()}</span>
                                         </div>
                                         <div className="grid grid-cols-2 gap-2 text-slate-600">
                                            <div><span className="font-bold">Intensidade (FRP):</span> {item.frp?.toFixed(1) || "—"}</div>
                                            <div><span className="font-bold">Coords:</span> {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(!data.acoes?.length && !data.desmatamentos?.length && !data.focos?.length) && (
                            <div className="p-6 border border-dashed border-slate-300 text-center text-slate-500 text-sm">
                                Nenhuma ocorrência ou alerta registrado para esta propriedade.
                            </div>
                        )}
                    </section>
                </main>

                <footer className="mt-auto px-10 py-6 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        Sistema de Monitoramento Ambiental - PRISMA • Documento gerado eletronicamente em {new Date().toLocaleDateString()}
                    </p>
                </footer>
            </div>
        </div>
    )
}

function PrintStatCard({ label, value, sub, icon: Icon, alert }: any) {
    return (
        <div className={`p-4 border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'} rounded text-center`}>
            {Icon && <Icon className={`w-5 h-5 mx-auto mb-2 ${alert ? 'text-red-500' : 'text-slate-400'}`} />}
            <div className="text-2xl font-black text-slate-800 leading-none">{value}</div>
            <div className="text-[10px] font-bold uppercase text-slate-500 mt-1">{label}</div>
            {sub && <div className="text-[10px] font-mono text-slate-400 mt-1">{sub}</div>}
        </div>
    )
}
