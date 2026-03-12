"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Map as MapIcon, Info, Upload, Edit, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GeoJsonUploader } from "./geojson-uploader";
import { useRouter } from "next/navigation";
import { PropertyEditDialog } from "./property-edit-dialog";

export interface PropertyDto {
  id: number;
  codImovel?: string | null;
  nome?: string | null;
  municipio?: string | null;
  properties?: any;
  geojson?: any;
}

export function PropertiesManager({
  regionId,
  properties,
  onPropertiesUpdate,
  selectedPropertyId,
  onPropertySelect,
}: {
  regionId: number;
  properties: PropertyDto[];
  onPropertiesUpdate: () => void;
  selectedPropertyId?: number | null;
  onPropertySelect?: (id: number | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{current: number, total: number, inserted: number, skipped: number} | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyDto | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredProperties = properties.filter((prop) => {
    if (selectedPropertyId != null) {
      return prop.id === selectedPropertyId;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (prop.nome && prop.nome.toLowerCase().includes(term)) ||
      (prop.codImovel && prop.codImovel.toLowerCase().includes(term)) ||
      prop.id.toString() === term
    );
  });

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/regions/${regionId}/commit-properties`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
         try {
           const errData = await response.json();
           throw new Error(errData.error?.message || "Erro ao fazer upload das propriedades.");
         } catch(e) {
           throw new Error("Erro desconhecido ao comunicar com o servidor. Status: " + response.status);
         }
      }

      if (!response.body) {
        throw new Error("O servidor não retornou um stream de resposta.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Stream loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // NDJSON logic (newline delimited)
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            boundary = buffer.indexOf('\n');

            if (line) {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.type === 'progress') {
                        setProgress(parsed.data);
                    } else if (parsed.type === 'complete') {
                        setIsUploading(false);
                        setProgress(null);
                        alert(`Sucesso! ${parsed.data.inserted} propriedades inseridas. ${parsed.data.skipped} propriedades ignoradas (sobreposição/duplicadas).`);
                        onPropertiesUpdate();
                        router.refresh();
                        return;
                    } else if (parsed.type === 'error') {
                        throw new Error(parsed.message);
                    }
                } catch(e) {
                   console.error("Falha ao organizar pacote de stream", e);
                }
            }
        }
      }

    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "Erro desconhecido ao enviar o arquivo.");
      setIsUploading(false);
      setProgress(null);
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-500" /> Propriedades (CAR)
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Gerencie os polígonos de propriedades</p>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-50/50 dark:bg-neutral-950/20 styling-scrollbar">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 flex gap-3 text-sm text-blue-800 dark:text-blue-200">
           <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
           <div>
             <p className="font-semibold mb-1">Upload de CARs</p>
             <p className="opacity-90 leading-relaxed">
               Faça o upload de um GeoJSON contendo os limites das propriedades (ex: dados do SICAR). Polígonos idênticos aos já existentes nesta região serão automaticamente ignorados para evitar duplicação.
             </p>
           </div>
        </div>

        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white dark:bg-neutral-900 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
          <Upload className={`w-8 h-8 mb-3 ${isUploading ? 'text-blue-500 animate-bounce' : 'text-neutral-400'}`} />
          <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
             {isUploading ? 'Enviando e Processando...' : 'Adicionar Propriedades'}
          </h4>
          <p className="text-xs text-neutral-500 max-w-[250px] mb-4">
             {isUploading ? 'Por favor, não feche esta página enquanto o processamento estiver em andamento.' : 'Selecione um arquivo .geojson com as feições que deseja importar.'}
          </p>

          {!isUploading && (
             <GeoJsonUploader onUpload={handleUpload} isUploading={isUploading} />
          )}

          {isUploading && progress && (
              <div className="w-full max-w-sm mt-4 mb-2 animate-in fade-in duration-300">
                 <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                    <span>Lendo feições ({progress.current}/{progress.total})</span>
                    <span>{Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%</span>
                 </div>
                 <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden shadow-inner border border-neutral-300 dark:border-neutral-700">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-[11px] mt-3 font-mono font-medium">
                    <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/50">
                       +{progress.inserted} adicionadas
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
                       ~ {progress.skipped} ignoradas
                    </span>
                 </div>
              </div>
          )}
          {isUploading && !progress && (
             <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500 font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> Iniciando processamento...
             </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
           <div className="flex justify-between items-center">
             <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Propriedades Carregadas</h4>
             <span className="text-xs font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">Total: {properties.length}</span>
           </div>

           <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
             <Input
               placeholder="Buscar por CAR, Nome ou ID..."
               className="pl-9 h-9 text-sm bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
               value={searchTerm}
               onChange={(e) => {
                 setSearchTerm(e.target.value);
                 if (selectedPropertyId != null && onPropertySelect) {
                   onPropertySelect(null);
                 }
               }}
             />
           </div>

           {filteredProperties.length === 0 ? (
              <p className="text-xs text-center text-neutral-500 py-6">Nenhuma propriedade encontrada.</p>
           ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 styling-scrollbar">
                 {filteredProperties.map(prop => (
                   <div 
                     key={prop.id} 
                     onClick={() => onPropertySelect && onPropertySelect(selectedPropertyId === prop.id ? null : prop.id)}
                     className={`text-xs p-3 rounded-lg border flex justify-between items-center shadow-sm cursor-pointer transition-colors ${
                       selectedPropertyId === prop.id 
                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700' 
                         : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-blue-300 dark:hover:border-blue-700'
                     }`}
                   >
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]" title={prop.nome || prop.codImovel || `ID ${prop.id}`}>
                           {prop.nome || prop.codImovel || `Propriedade #${prop.id}`}
                        </p>
                        <p className="text-neutral-500 mt-0.5 truncate max-w-[180px]">{prop.municipio || 'Município não informado'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 text-[10px] font-mono border border-neutral-200 dark:border-neutral-700">ID: {prop.id}</span>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-6 w-6 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400"
                           onClick={() => {
                             setSelectedProperty(prop);
                             setIsEditDialogOpen(true);
                           }}
                         >
                           <Edit className="w-3.5 h-3.5" />
                         </Button>
                      </div>
                   </div>
                 ))}
              </div>
           )}
        </div>
      </div>

      <PropertyEditDialog
        property={selectedProperty}
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={() => {
          onPropertiesUpdate();
          router.refresh();
        }}
        regionId={regionId}
      />
    </div>
  );
}
