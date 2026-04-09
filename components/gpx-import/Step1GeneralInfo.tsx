"use client";

import { useState, useCallback } from "react";
import { FileText, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GpxUploader } from "./GpxUploader";
import { convertGpxToGeoJSON, extractTrackAsWKT, extractWaipointsAsWKT } from "@/lib/helpers/gpxParser";

interface RegionDto {
  id: number;
  nome: string;
}

interface GpxMetadata {
  nome: string;
  totalPontos: number;
  distanciaTotal: number; // em km
  dataInicio: string | null;
  dataFim: string | null;
  duracao: string | null;
  numTracks: number;
  numWaypoints: number;
}

interface Step1Props {
  regionId: number;
  regioes: RegionDto[];
  onNext: (data: {
    arquivo: File;
    geojson: any;
    metadata: GpxMetadata;
    regiaoId: number;
    nome: string;
  }) => void;
  onCancel: () => void;
}

export function Step1GeneralInfo({ regionId, regioes, onNext, onCancel }: Step1Props) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [geojson, setGeojson] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [regiaoId, setRegiaoId] = useState<string>(regionId.toString());

  const [metadata, setMetadata] = useState<GpxMetadata | null>(null);

  const calcularDistancia = (coordinates: number[][]): number => {
    let distancia = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];

      const R = 6371; // Raio da Terra em km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distancia += R * c;
    }
    return distancia;
  };

  const extrairMetadata = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);

      try {
        const geo = await convertGpxToGeoJSON(file);
        setGeojson(geo);

        // Nome padrão do arquivo
        const nomeArquivo = file.name.replace(/\.gpx$/i, "");
        setNome(nomeArquivo);

        // Contar tracks e waypoints
        const tracks = geo.features.filter((f: any) => f.geometry.type === "LineString");
        const waypoints = geo.features.filter((f: any) => f.geometry.type === "Point");

        const numTracks = tracks.length;
        const numWaypoints = waypoints.length;

        // Calcular distância total
        let distanciaTotal = 0;
        let dataInicio: string | null = null;
        let dataFim: string | null = null;
        let totalPontos = 0;

        for (const track of tracks) {
          const coords = (track.geometry as any).coordinates as number[][];
          totalPontos += coords.length;
          distanciaTotal += calcularDistancia(coords);

          // Extrair datas
          if (track.properties?.time) {
            const time = track.properties.time;
            if (!dataInicio || time < dataInicio) dataInicio = time;
            if (!dataFim || time > dataFim) dataFim = time;
          }
        }

        // Contar waypoints no total de pontos
        totalPontos += numWaypoints;

        // Calcular duração
        let duracao: string | null = null;
        if (dataInicio && dataFim) {
          const inicio = new Date(dataInicio);
          const fim = new Date(dataFim);
          const diffMs = fim.getTime() - inicio.getTime();
          const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duracao = `${diffHoras}h ${diffMinutos}min`;
        }

        const metadataExtra: GpxMetadata = {
          nome: nomeArquivo,
          totalPontos,
          distanciaTotal: Math.round(distanciaTotal * 100) / 100,
          dataInicio,
          dataFim,
          duracao,
          numTracks,
          numWaypoints,
        };

        setMetadata(metadataExtra);
      } catch (err) {
        console.error("Erro ao processar GPX:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido ao processar arquivo GPX.");
        setArquivo(null);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setArquivo(file);
      await extrairMetadata(file);
    },
    [extrairMetadata]
  );

  const handleNext = () => {
    if (!arquivo || !geojson || !metadata) {
      setError("Faça upload de um arquivo GPX válido.");
      return;
    }

    if (metadata.numTracks === 0 && metadata.numWaypoints === 0) {
      setError("O arquivo GPX deve conter pelo menos 1 trilha ou 1 waypoint.");
      return;
    }

    if (nome.trim().length < 3) {
      setError("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (!regiaoId) {
      setError("Selecione uma região.");
      return;
    }

    onNext({
      arquivo,
      geojson,
      metadata,
      regiaoId: parseInt(regiaoId, 10),
      nome: nome.trim(),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Importar Ações via GPX
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Etapa 1 de 3: Upload e Informações Gerais
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Section */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">
            Arquivo GPX
          </h4>
        </div>

        {!arquivo ? (
          <GpxUploader onUpload={handleFileUpload} isProcessing={isProcessing} />
        ) : (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate">
                {arquivo.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {(arquivo.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setArquivo(null);
                setGeojson(null);
                setMetadata(null);
                setNome("");
              }}
              className="shrink-0 text-neutral-500 hover:text-red-600 dark:hover:text-red-400"
            >
              Trocar
            </Button>
          </div>
        )}
      </div>

      {/* Metadata Display */}
      {metadata && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Metadados Extraídos
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Total de Pontos
              </p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {metadata.totalPontos.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Distância Total
              </p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {metadata.distanciaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} km
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Nº de Tracks
              </p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {metadata.numTracks}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Nº de Waypoints
              </p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                {metadata.numWaypoints}
              </p>
            </div>

            {metadata.dataInicio && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Data Início
                </p>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                  {new Date(metadata.dataInicio).toLocaleString("pt-BR")}
                </p>
              </div>
            )}

            {metadata.dataFim && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Data Fim
                </p>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">
                  {new Date(metadata.dataFim).toLocaleString("pt-BR")}
                </p>
              </div>
            )}

            {metadata.duracao && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Duração
                </p>
                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                  {metadata.duracao}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">
          Informações da Importação
        </h4>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="gpx-nome" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nome da Importação <span className="text-red-500">*</span>
          </Label>
          <Input
            id="gpx-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Expedição Rio da Prata - Janeiro 2024"
            className="h-11"
            disabled={!arquivo}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Mínimo 3 caracteres. Este nome identificará o lote de ações importadas.
          </p>
        </div>

        {/* Região */}
        <div className="space-y-2">
          <Label htmlFor="gpx-regiao" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Região <span className="text-red-500">*</span>
          </Label>
          <Select value={regiaoId} onValueChange={setRegiaoId} disabled={regioes.length === 0}>
            <SelectTrigger id="gpx-regiao" className="h-11">
              <SelectValue placeholder="Selecione a região..." />
            </SelectTrigger>
            <SelectContent>
              {regioes.map((regiao) => (
                <SelectItem key={regiao.id} value={regiao.id.toString()}>
                  {regiao.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-11 px-6"
        >
          Cancelar
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={!arquivo || !metadata || isProcessing}
          className="h-11 px-8 gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Próximo →
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
