"use client";

import { useState } from "react";
import { Loader2, TreePine, Info } from "lucide-react";
import { GeoJsonUploader } from "./geojson-uploader";
import { useRouter } from "next/navigation";

export interface DesmatamentoDto {
  id: number;
  alertid?: string | null;
  alertcode?: string | null;
  alertha?: number | null;
  source?: string | null;
  detectat?: string | null;
  detectyear?: number | null;
  state?: string | null;
  stateha?: number | null;
  geojson?: string | null;
}

export function DesmatamentoManager({
  regionId,
  desmatamento,
  onUpdate,
}: {
  regionId: number;
  desmatamento: DesmatamentoDto[];
  onUpdate: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/regions/${regionId}/commit-desmatamento`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Erro ao salvar os dados de desmatamento.");
      }

      alert(
        `Sucesso! ${data.data.inserted} alertas inseridos. ${data.data.skipped} ignorados (duplicados ou sem geometria).`
      );
      onUpdate();
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
            <TreePine className="w-4 h-4 text-red-600" /> Desmatamento
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Importe alertas de desmatamento a partir de um GeoJSON
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-50/50 dark:bg-neutral-950/20 styling-scrollbar">
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/50 flex gap-3 text-sm text-red-800 dark:text-red-200">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
          <div>
            <p className="font-semibold mb-1">Upload de Desmatamento</p>
            <p className="opacity-90 leading-relaxed">
              Faça o upload de um GeoJSON com polígonos de alertas de desmatamento. Alertas com o mesmo{" "}
              <code className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">alertid</code> já existentes serão
              ignorados automaticamente.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white dark:bg-neutral-900 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
          <TreePine
            className={`w-8 h-8 mb-3 ${isUploading ? "text-red-500 animate-pulse" : "text-neutral-400"}`}
          />
          <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            {isUploading ? "Processando..." : "Adicionar Desmatamento"}
          </h4>
          <p className="text-xs text-neutral-500 max-w-[250px] mb-4">
            {isUploading
              ? "Por favor, não feche esta página enquanto o processamento estiver em andamento."
              : "Selecione um arquivo .geojson com os alertas de desmatamento."}
          </p>

          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-red-500" /> Salvando alertas...
            </div>
          ) : (
            <GeoJsonUploader onUpload={handleUpload} isUploading={isUploading} />
          )}
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Alertas Carregados</h4>
            <span className="text-xs font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
              Total: {desmatamento.length}{desmatamento.length >= 500 ? " (limite: 500)" : ""}
            </span>
          </div>

          {desmatamento.length === 0 ? (
            <p className="text-xs text-center text-neutral-500 py-6">Nenhum alerta de desmatamento registrado.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 styling-scrollbar">
              {desmatamento.map((item) => (
                <div
                  key={item.id}
                  className="text-xs p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <TreePine className="w-3 h-3 text-red-500 shrink-0" />
                      {item.alertid || `#${item.id}`}
                      {item.detectyear && (
                        <span className="font-normal text-neutral-500"> · {item.detectyear}</span>
                      )}
                    </p>
                    {item.alertha != null && (
                      <p className="text-neutral-500 mt-0.5">{item.alertha.toFixed(2)} ha</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.source && (
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        {item.source}
                      </span>
                    )}
                    {item.state && (
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold">{item.state}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
