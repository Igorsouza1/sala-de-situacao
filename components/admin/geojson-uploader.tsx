"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";

interface GeoJsonUploaderProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export function GeoJsonUploader({ onUpload, isUploading }: GeoJsonUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);

    if (!file) return;

    if (!file.name.endsWith(".geojson") && !file.name.endsWith(".json")) {
      setError("Por favor, selecione um arquivo .geojson ou .json válido.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Pass the raw file object directly to avoid client-side JSON parsing of potentially massive files
    onUpload(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept=".geojson,.json,application/json,application/geo+json"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleButtonClick}
        disabled={isUploading}
        className="h-12 w-full sm:w-auto px-6 rounded-xl font-medium gap-2 border-dashed border-2 border-neutral-300 dark:border-neutral-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        <UploadCloud className="w-5 h-5" />
        {isUploading ? "Processando..." : "Adicionar Nova Área (GeoJSON)"}
      </Button>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
          <X className="w-4 h-4" /> {error}
        </div>
      )}
    </div>
  );
}
