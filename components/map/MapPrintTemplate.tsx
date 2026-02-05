"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { formatDate } from "@/lib/helpers/formatter/formatDate"

// Dynamic import for the map to avoid SSR issues
const GenericStaticMap = dynamic(() => import("./GenericStaticMap"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Carregando Mapa...</div>
})

interface MapPrintTemplateProps {
  lat: number
  lng: number
  zoom: number
  layers: any[]
  activeSlugs: string[]
}

export function MapPrintTemplate({ lat, lng, zoom, layers, activeSlugs }: MapPrintTemplateProps) {
  // ... (useEffect remains same) ...

  const currentDate = new Date()

  // Helper to flatten legend items based on active selection
  const legendItems = layers.flatMap(layer => {
      // 1. If layer has groups, check which ones are active
      if (layer.groups && layer.groups.length > 0) {
          const activeGroups = layer.groups.filter((g: any) => 
               activeSlugs.includes(`${layer.slug}__${g.id}`)
          );
          
          if (activeGroups.length > 0) {
              return activeGroups.map((g: any) => ({
                  id: `${layer.slug}-${g.id}`,
                  label: g.label, // Use group label (e.g. "Fiscalização")
                  color: g.color || layer.visualConfig?.baseStyle?.color || '#3388ff',
                  icon: g.icon
              }));
          }
      }

      // 2. Fallback / Standard Layer (No groups or full layer selected without specific group filter?)
      // Actually, if we have groups but no specific group selected (meaning maybe "Select All" or special logic?)
      // BUT page.tsx filters data based on slugs. If no sub-slug is present, page.tsx might not filter strict?
      // Let's assume if it is a formatted grouped layer, we rely on the sub-items.
      
      // If it's a simple layer OR no sub-groups active (but layer is in list), just show main layer
      return [{
          id: layer.id,
          label: layer.name,
          color: layer.visualConfig?.baseStyle?.color || layer.visualConfig?.mapMarker?.color || '#3388ff',
          icon: layer.visualConfig?.baseStyle?.iconName
      }]
  })


  return (
    <div className="min-h-screen bg-white">
        {/* ... (styles remain, maybe ensure text color force) ... */}
        <style jsx global>{`
         @media print {
           @page { 
             size: A4 landscape; 
             margin: 0; 
           }
           html, body {
             height: 100%;
             margin: 0 !important;
             padding: 0 !important;
             overflow: hidden !important;
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
           }
           .no-print { display: none !important; }
           /* Force text visibility */
           .print-text-dark { color: #000 !important; text-shadow: none !important; }
         }
       `}</style>
       
       <div className="w-[297mm] h-[210mm] relative bg-white overflow-hidden flex flex-col">
           
           {/* MAP LAYER (Full Background) */}
           <div className="absolute inset-0 z-0">
               <GenericStaticMap 
                  center={[lat, lng]} 
                  zoom={zoom} 
                  layers={layers}
               />
           </div>

           {/* OVERLAY HEADER */}
           <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
               {/* Left: Logos */}
               <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200 flex items-center gap-4">
                   <img 
                     src="/brasao-bonito.jpeg"
                     alt="Brasão Bonito" 
                     className="h-12 w-auto object-contain"
                   />
                   <div className="h-8 w-[1px] bg-slate-300"></div>
                   <img 
                     src="/prisma_logo_revert.png" 
                     alt="PRISMA" 
                     className="h-10 w-auto object-contain"
                   />
                   <div className="ml-2">
                       <h1 className="text-sm font-black text-slate-900 leading-tight uppercase print-text-dark">Sala de Situação</h1>
                       <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase print-text-dark">Município de Bonito/MS</p>
                   </div>
               </div>

               {/* Right: Date/Time */}
               <div className="bg-white/90 backdrop-blur-md p-2 px-4 rounded-lg shadow-lg border border-slate-200 text-right">
                   <p className="text-xs font-bold text-slate-900 uppercase print-text-dark">Relatório de Visualização</p>
                   <p className="text-[10px] text-slate-500 font-mono print-text-dark">
                       {currentDate.toLocaleDateString('pt-BR')} • {currentDate.toLocaleTimeString('pt-BR')}
                   </p>
               </div>
           </div>

           {/* OVERLAY LEGEND (Bottom Right) */}
           <div className="absolute bottom-4 right-4 z-10 max-w-[250px] pointer-events-none">
               <div className="bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-lg border border-slate-200 space-y-2">
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-1 mb-1 print-text-dark">
                       Legenda (Camadas Visíveis)
                   </h3>
                   {legendItems.length > 0 ? (
                       <div className="space-y-1">
                           {legendItems.map((item) => (
                               <div key={item.id} className="flex items-center gap-2">
                                   {/* Simple Icon Representation */}
                                   <div 
                                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                                      style={{ backgroundColor: item.color }}
                                   />
                                   <span className="text-xs font-semibold text-slate-800 truncate print-text-dark">
                                       {item.label}
                                   </span>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <p className="text-[10px] text-slate-500 italic print-text-dark">Nenhuma camada de dados visível.</p>
                   )}
               </div>
           </div>

           {/* OVERLAY FOOTER (Bottom Left) */}
           <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-2 px-3 rounded-lg shadow-lg border border-slate-200 flex gap-4 text-[10px] font-mono text-slate-600">
                    <span>
                        <strong>LAT:</strong> {lat.toFixed(6)}
                    </span>
                    <span>
                        <strong>LNG:</strong> {lng.toFixed(6)}
                    </span>
                    <span>
                         <strong>ZOOM:</strong> {zoom}
                    </span>
                </div>
           </div>
       </div>
    </div>
  )
}
