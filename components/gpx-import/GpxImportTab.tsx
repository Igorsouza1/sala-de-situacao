"use client";

import { useState } from "react";
import { Step1GeneralInfo } from "./Step1GeneralInfo";
import { Step2TrailData } from "./Step2TrailData";
import { Step3Waypoints } from "./Step3Waypoints";
import { extractWaipointsAsWKT } from "@/lib/helpers/gpxParser";

interface RegionDto {
  id: number;
  nome: string;
}

interface GpxImportTabProps {
  regionId: number;
  regioes: RegionDto[];
  onTrailPreview?: (geojson: any | null) => void;
}

interface ImportState {
  step: 1 | 2 | 3;
  arquivo: File | null;
  geojson: any | null;
  metadata: any | null;
  nome: string;
  regiaoId: number;
  trilhaData: any | null;
  waypoints: any[] | null;
}

export function GpxImportTab({ regionId, regioes, onTrailPreview }: GpxImportTabProps) {
  const [state, setState] = useState<ImportState>({
    step: 1,
    arquivo: null,
    geojson: null,
    metadata: null,
    nome: "",
    regiaoId: regionId,
    trilhaData: null,
    waypoints: null,
  });

  const handleStep1Complete = (data: any) => {
    // Extrair tracks do geojson
    const tracks = data.geojson.features.filter((f: any) => f.geometry.type === "LineString");
    const hasTrack = tracks.length > 0;

    // Extrair waypoints
    const waypointsGpx = extractWaipointsAsWKT(data.geojson);

    // Se tem track, enviar para preview no mapa
    if (hasTrack && onTrailPreview) {
      onTrailPreview(data.geojson);
    }

    setState((prev) => ({
      ...prev,
      ...data,
      waypoints: waypointsGpx.length > 0 ? waypointsGpx : null,
      step: hasTrack ? 2 : 3, // Pular etapa 2 se não tem track
    }));
  };

  const handleStep2Complete = (trilhaData: any) => {
    // Extrair waypoints do geojson
    const waypointsGpx = extractWaipointsAsWKT(state.geojson);
    
    setState((prev) => ({
      ...prev,
      trilhaData,
      waypoints: waypointsGpx,
      step: 3,
    }));
  };

  const handleStep3Submit = async (data: any) => {
    console.log("Dados finais para envio:", {
      nome: state.nome,
      regiaoId: state.regiaoId,
      trilha: state.trilhaData,
      waypoints: data.waypoints,
    });
    
    // TODO: Chamar API /api/gpx/import
    // Por enquanto, só mostra sucesso
    alert(`✅ Importação concluída!\n\n${data.waypoints.length} ações criadas com sucesso.`);
    
    // Limpar e voltar ao início
    handleCancel();
  };

  const handleBack = () => {
    setState((prev) => ({
      ...prev,
      step: (prev.step - 1) as 1 | 2 | 3,
    }));
  };

  const handleCancel = () => {
    // Limpar preview do mapa
    if (onTrailPreview) {
      onTrailPreview(null);
    }
    setState({
      step: 1,
      arquivo: null,
      geojson: null,
      metadata: null,
      nome: "",
      regiaoId: regionId,
      trilhaData: null,
      waypoints: null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stepper Indicator */}
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex items-center gap-3">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${
                  state.step === 1
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : state.step > 1
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              {state.step > 1 ? "✓" : "1"}
            </div>
            <span
              className={`
                text-xs font-medium text-center max-w-[100px]
                ${
                  state.step === 1
                    ? "text-blue-600 dark:text-blue-400"
                    : state.step > 1
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              Info Geral
            </span>
          </div>

          {/* Connector 1-2 */}
          <div
            className={`
              w-16 h-1 rounded-full transition-all
              ${state.step > 1 ? "bg-emerald-600" : "bg-neutral-200 dark:bg-neutral-800"}
            `}
          />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${
                  state.step === 2
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : state.step > 2
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              {state.step > 2 ? "✓" : "2"}
            </div>
            <span
              className={`
                text-xs font-medium text-center max-w-[100px]
                ${
                  state.step === 2
                    ? "text-blue-600 dark:text-blue-400"
                    : state.step > 2
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              Trilha
            </span>
          </div>

          {/* Connector 2-3 */}
          <div
            className={`
              w-16 h-1 rounded-full transition-all
              ${state.step > 2 ? "bg-emerald-600" : "bg-neutral-200 dark:bg-neutral-800"}
            `}
          />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${
                  state.step === 3
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              3
            </div>
            <span
              className={`
                text-xs font-medium text-center max-w-[100px]
                ${
                  state.step === 3
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              Ações
            </span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {state.step === 1 && (
          <Step1GeneralInfo
            regionId={regionId}
            regioes={regioes}
            onNext={handleStep1Complete}
            onCancel={handleCancel}
          />
        )}

        {state.step === 2 && state.geojson && state.metadata && (
          <Step2TrailData
            geojson={state.geojson}
            metadata={state.metadata}
            nomeImportacao={state.nome}
            onNext={handleStep2Complete}
            onBack={handleBack}
          />
        )}

        {state.step === 3 && state.waypoints && (
          <Step3Waypoints
            waypoints={state.waypoints}
            nomeImportacao={state.nome}
            regiaoId={state.regiaoId}
            onSubmit={handleStep3Submit}
            onBack={handleBack}
          />
        )}

        {state.step === 3 && !state.waypoints && (
          <div className="text-center py-20 space-y-4">
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Nenhum waypoint encontrado no arquivo GPX.
            </p>
            <button
              type="button"
              onClick={() => {
                if (onTrailPreview) onTrailPreview(null);
                setState((prev) => ({ ...prev, step: 1 }));
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Voltar ao início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
