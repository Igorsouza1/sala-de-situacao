"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X } from "lucide-react";
import { FeatureCollection, Feature, Geometry } from "geojson";

interface GeoJsonUploaderProps {
  onUpload: (geojson: FeatureCollection | Feature | Geometry) => void;
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
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.type) {
        throw new Error("Arquivo GeoJSON inválido: propriedade 'type' ausente.");
      }

      // We support FeatureCollection, Feature or plain Geometries
      const validTypes = ["FeatureCollection", "Feature", "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"];

      if (!validTypes.includes(parsed.type)) {
         throw new Error(`Tipo GeoJSON não suportado: ${parsed.type}`);
      }

      onUpload(parsed);
    } catch (err: any) {
      setError(err.message || "Erro ao ler o arquivo. Verifique se é um JSON válido.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
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
