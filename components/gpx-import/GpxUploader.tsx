"use client";

import { useState, useRef, useCallback } from "react";
import { UploadCloud, X, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GpxUploaderProps {
  onUpload: (file: File) => void;
  isProcessing?: boolean;
}

export function GpxUploader({ onUpload, isProcessing }: GpxUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateGpxFile = useCallback((file: File): boolean => {
    const validExtensions = [".gpx"];
    const validMimeTypes = ["application/gpx+xml", "text/xml", "application/xml", "text/gpx"];

    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    const hasValidMimeType = validMimeTypes.includes(file.type);

    if (!hasValidExtension && !hasValidMimeType) {
      setError("Arquivo inválido. Apenas arquivos .GPX são aceitos.");
      return false;
    }

    // 10MB limit
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("Arquivo muito grande. Tamanho máximo: 10MB.");
      return false;
    }

    return true;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!validateGpxFile(file)) {
        return;
      }

      try {
        // Test if file can be read
        const content = await file.text();
        if (!content.includes("<gpx") && !content.includes("<gpx")) {
          setError("Arquivo corrompido ou não é um GPX válido.");
          return;
        }

        onUpload(file);
      } catch {
        setError("Erro ao ler o arquivo. Tente novamente.");
      }
    },
    [onUpload, validateGpxFile]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processFile(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      await processFile(file);
    },
    [processFile]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept=".gpx,application/gpx+xml,text/xml"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]"
              : "border-neutral-300 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600"
          }
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={`
              w-14 h-14 rounded-full flex items-center justify-center transition-all
              ${
                isDragOver
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
              }
            `}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {isDragOver ? "Solte o arquivo GPX aqui" : "Arraste o arquivo GPX aqui"}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ou clique para selecionar • Máx 10MB
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleButtonClick}
            disabled={isProcessing}
            className="h-10 px-6 gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            {isProcessing ? "Processando..." : "Selecionar Arquivo"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
          <X className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Erro no arquivo</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="shrink-0 hover:bg-red-100 dark:hover:bg-red-900/30 rounded p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success indicator when file is uploaded */}
      {!error && isProcessing && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
          <FileCheck className="w-4 h-4" />
          <span className="font-medium">Processando arquivo GPX...</span>
        </div>
      )}
    </div>
  );
}
