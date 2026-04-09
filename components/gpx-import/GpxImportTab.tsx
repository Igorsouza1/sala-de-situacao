"use client";

import { useState } from "react";
import { Step1GeneralInfo } from "./Step1GeneralInfo";

interface RegionDto {
  id: number;
  nome: string;
}

interface GpxImportTabProps {
  regionId: number;
  regioes: RegionDto[];
}

export function GpxImportTab({ regionId, regioes }: GpxImportTabProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [importData, setImportData] = useState<any>(null);

  const handleStep1Complete = (data: any) => {
    setImportData(data);
    setCurrentStep(2);
    // TODO: Implementar Etapa 2
    console.log("Dados da Etapa 1:", data);
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setImportData(null);
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
                  currentStep === 1
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : currentStep > 1
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              {currentStep > 1 ? "✓" : "1"}
            </div>
            <span
              className={`
                text-xs font-medium text-center max-w-[100px]
                ${
                  currentStep === 1
                    ? "text-blue-600 dark:text-blue-400"
                    : currentStep > 1
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
              ${currentStep > 1 ? "bg-emerald-600" : "bg-neutral-200 dark:bg-neutral-800"}
            `}
          />

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${
                  currentStep === 2
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : currentStep > 2
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                }
              `}
            >
              {currentStep > 2 ? "✓" : "2"}
            </div>
            <span
              className={`
                text-xs font-medium text-center max-w-[100px]
                ${
                  currentStep === 2
                    ? "text-blue-600 dark:text-blue-400"
                    : currentStep > 2
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
              ${currentStep > 2 ? "bg-emerald-600" : "bg-neutral-200 dark:bg-neutral-800"}
            `}
          />

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-2">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${
                  currentStep === 3
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
                  currentStep === 3
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
        {currentStep === 1 && (
          <Step1GeneralInfo
            regionId={regionId}
            regioes={regioes}
            onNext={handleStep1Complete}
            onCancel={handleCancel}
          />
        )}

        {currentStep === 2 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Etapa 2 - Dados da Trilha
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Em desenvolvimento...
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Pular para Etapa 3 (demo)
            </button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="text-center py-20 space-y-4">
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Etapa 3 - Classificação de Waypoints como Ações
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Em desenvolvimento...
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Voltar ao início (demo)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
