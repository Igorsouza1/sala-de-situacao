"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Map as MapIcon, Info, Upload } from "lucide-react";
import { GeoJsonUploader } from "./geojson-uploader";
import { useRouter } from "next/navigation";

export interface PropertyDto {
  id: number;
  codImovel?: string | null;
  nome?: string | null;
  municipio?: string | null;
  geojson?: any;
}

export function PropertiesManager({
  regionId,
  properties,
  onPropertiesUpdate,
}: {
  regionId: number;
  properties: PropertyDto[];
  onPropertiesUpdate: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/regions/${regionId}/commit-properties`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Erro ao fazer upload das propriedades.");
      }

      alert(`Sucesso! ${data.data?.inserted} propriedades inseridas. ${data.data?.skipped} propriedades ignoradas (sobreposição/duplicadas).`);
      onPropertiesUpdate();
      router.refresh();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error instanceof Error ? error.message : "Erro desconhecido ao enviar o arquivo.");
    } finally {
      setIsUploading(false);
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
          <Upload className="w-8 h-8 text-neutral-400 mb-3" />
          <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">Adicionar Propriedades</h4>
          <p className="text-xs text-neutral-500 max-w-[250px] mb-4">Selecione um arquivo .geojson com as feições que deseja importar.</p>
          <GeoJsonUploader onUpload={handleUpload} isUploading={isUploading} />
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
           <div className="flex justify-between items-center mb-3">
             <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Propriedades Carregadas</h4>
             <span className="text-xs font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">Total: {properties.length}</span>
           </div>

           {properties.length === 0 ? (
              <p className="text-xs text-center text-neutral-500 py-6">Nenhuma propriedade cadastrada ainda.</p>
           ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                 {properties.map(prop => (
                   <div key={prop.id} className="text-xs p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]" title={prop.nome || prop.codImovel || `ID ${prop.id}`}>
                           {prop.nome || prop.codImovel || `Propriedade #${prop.id}`}
                        </p>
                        <p className="text-neutral-500 mt-0.5 truncate max-w-[180px]">{prop.municipio || 'Município não informado'}</p>
                      </div>
                      <span className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 text-[10px] font-mono border border-neutral-200 dark:border-neutral-700">ID: {prop.id}</span>
                   </div>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
