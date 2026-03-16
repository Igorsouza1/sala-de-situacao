"use client";

import { useState } from "react";
import { Loader2, Flame, Upload, Info } from "lucide-react";
import { GeoJsonUploader } from "./geojson-uploader";
import { useRouter } from "next/navigation";

export interface FocoDto {
  id: string;
  latitude: number;
  longitude: number;
  acqDate: string;
  acqTime?: string | null;
  satellite?: string | null;
  confidence?: string | null;
  frp?: number | null;
  daynight?: string | null;
}

export function FocosManager({
  regionId,
  focos,
  onFocosUpdate,
}: {
  regionId: number;
  focos: FocoDto[];
  onFocosUpdate: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{
    current: number;
    total: number;
    inserted: number;
    skipped: number;
  } | null>(null);
  const router = useRouter();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/regions/${regionId}/commit-focos`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        try {
          const errData = await response.json();
          throw new Error(errData.error?.message || "Erro ao fazer upload dos focos.");
        } catch (e) {
          throw new Error("Erro desconhecido ao comunicar com o servidor. Status: " + response.status);
        }
      }

      if (!response.body) {
        throw new Error("O servidor não retornou um stream de resposta.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf("\n");
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 1);
          boundary = buffer.indexOf("\n");

          if (line) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.type === "progress") {
                setProgress(parsed.data);
              } else if (parsed.type === "complete") {
                setIsUploading(false);
                setProgress(null);
                alert(
                  `Sucesso! ${parsed.data.inserted} focos inseridos. ${parsed.data.skipped} ignorados (duplicados ou sem dados obrigatórios).`
                );
                onFocosUpdate();
                router.refresh();
                return;
              } else if (parsed.type === "error") {
                throw new Error(parsed.message);
              }
            } catch (e) {
              console.error("Falha ao processar pacote de stream", e);
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

  const confidenceColor = (confidence?: string | null) => {
    if (!confidence) return "text-neutral-400";
    const c = confidence.toLowerCase();
    if (c === "high" || c === "h") return "text-red-600 dark:text-red-400";
    if (c === "nominal" || c === "medium" || c === "n") return "text-orange-500 dark:text-orange-400";
    return "text-yellow-500 dark:text-yellow-400";
  };

  return (
    <div className="w-full h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
      <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Focos de Incêndio
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Importe focos a partir de um GeoJSON (ex: NASA FIRMS)
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-neutral-50/50 dark:bg-neutral-950/20 styling-scrollbar">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50 flex gap-3 text-sm text-orange-800 dark:text-orange-200">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-orange-500 dark:text-orange-400" />
          <div>
            <p className="font-semibold mb-1">Upload de Focos</p>
            <p className="opacity-90 leading-relaxed">
              Faça o upload de um GeoJSON com pontos de focos de incêndio. Cada feição deve ter geometria Point e a
              propriedade <code className="font-mono bg-orange-100 dark:bg-orange-900/40 px-1 rounded">acq_date</code>.
              Focos com mesma data, latitude e longitude já existentes serão ignorados automaticamente.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white dark:bg-neutral-900 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
          <Flame
            className={`w-8 h-8 mb-3 ${isUploading ? "text-orange-500 animate-bounce" : "text-neutral-400"}`}
          />
          <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            {isUploading ? "Enviando e Processando..." : "Adicionar Focos"}
          </h4>
          <p className="text-xs text-neutral-500 max-w-[250px] mb-4">
            {isUploading
              ? "Por favor, não feche esta página enquanto o processamento estiver em andamento."
              : "Selecione um arquivo .geojson com os focos que deseja importar."}
          </p>

          {!isUploading && <GeoJsonUploader onUpload={handleUpload} isUploading={isUploading} />}

          {isUploading && progress && (
            <div className="w-full max-w-sm mt-4 mb-2 animate-in fade-in duration-300">
              <div className="flex justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
                <span>
                  Processando focos ({progress.current}/{progress.total})
                </span>
                <span>{Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden shadow-inner border border-neutral-300 dark:border-neutral-700">
                <div
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] mt-3 font-mono font-medium">
                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/50">
                  +{progress.inserted} inseridos
                </span>
                <span className="text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/50 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700">
                  ~ {progress.skipped} ignorados
                </span>
              </div>
            </div>
          )}
          {isUploading && !progress && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-neutral-500 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Iniciando processamento...
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">Focos Carregados</h4>
            <span className="text-xs font-mono bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
              Total: {focos.length}{focos.length >= 500 ? " (limite: 500)" : ""}
            </span>
          </div>

          {focos.length === 0 ? (
            <p className="text-xs text-center text-neutral-500 py-6">Nenhum foco de incêndio registrado.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 styling-scrollbar">
              {focos.map((foco) => (
                <div
                  key={foco.id}
                  className="text-xs p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <Flame className="w-3 h-3 text-orange-500 shrink-0" />
                      {foco.acqDate}
                      {foco.acqTime && (
                        <span className="font-normal text-neutral-500">
                          {" "}
                          {foco.acqTime.slice(0, 2)}:{foco.acqTime.slice(2, 4)} UTC
                        </span>
                      )}
                    </p>
                    <p className="text-neutral-500 mt-0.5">
                      {foco.latitude.toFixed(4)}, {foco.longitude.toFixed(4)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {foco.confidence && (
                      <span className={`font-semibold uppercase ${confidenceColor(foco.confidence)}`}>
                        {foco.confidence}
                      </span>
                    )}
                    {foco.satellite && (
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        {foco.satellite}
                      </span>
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
