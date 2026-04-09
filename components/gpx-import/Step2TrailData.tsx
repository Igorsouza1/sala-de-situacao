"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar, Clock, Ruler, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GeoJsonData {
  type: string;
  features: any[];
}

interface TrailData {
  nome: string;
  dataInicio: string;
  dataFim: string;
  distanciaKm: number;
  duracaoMinutos: number;
  hasTrack: boolean;
  geojson: GeoJsonData | null;
}

interface Step2Props {
  geojson: GeoJsonData;
  metadata: {
    nome: string;
    distanciaTotal: number;
    dataInicio: string | null;
    dataFim: string | null;
    duracao: string | null;
    numTracks: number;
    numWaypoints: number;
  };
  nomeImportacao: string;
  onNext: (data: TrailData) => void;
  onBack: () => void;
}

export function Step2TrailData({ geojson, metadata, nomeImportacao, onNext, onBack }: Step2Props) {
  const [nome, setNome] = useState(nomeImportacao);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Extrair tracks do geojson
  const tracks = geojson.features.filter((f) => f.geometry.type === "LineString");
  const hasTrack = tracks.length > 0;

  // Calcular distância total dos tracks
  const distanciaKm = metadata.distanciaTotal;

  // Calcular duração em minutos
  const duracaoMinutos = (() => {
    if (metadata.dataInicio && metadata.dataFim) {
      const inicio = new Date(metadata.dataInicio);
      const fim = new Date(metadata.dataFim);
      return Math.round((fim.getTime() - inicio.getTime()) / (1000 * 60));
    }
    return 0;
  })();

  // Inicializar datas
  useEffect(() => {
    if (metadata.dataInicio) {
      // Converter para formato datetime-local
      const date = new Date(metadata.dataInicio);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      setDataInicio(localDate.toISOString().slice(0, 16));
    }

    if (metadata.dataFim) {
      const date = new Date(metadata.dataFim);
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      setDataFim(localDate.toISOString().slice(0, 16));
    }
  }, [metadata.dataInicio, metadata.dataFim]);

  const handleNext = () => {
    setError(null);

    if (hasTrack && nome.trim().length < 3) {
      setError("O nome deve ter pelo menos 3 caracteres.");
      return;
    }

    if (dataInicio && dataFim) {
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      if (inicio >= fim) {
        setError("A data de início deve ser anterior à data de fim.");
        return;
      }
    }

    onNext({
      nome: nome.trim(),
      dataInicio: dataInicio || "",
      dataFim: dataFim || "",
      distanciaKm,
      duracaoMinutos,
      hasTrack,
      geojson: hasTrack ? geojson : null,
    });
  };

  // Se não tem track, pular esta etapa
  if (!hasTrack) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Este arquivo GPX não contém trilhas (tracks). Apenas waypoints serão importados como Ações.
            <br />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Avançando automaticamente para a Etapa 3...
            </span>
          </AlertDescription>
        </Alert>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onNext({ nome: "", dataInicio: "", dataFim: "", distanciaKm: 0, duracaoMinutos: 0, hasTrack: false, geojson: null })} className="h-11 px-8 gap-2">
            Avançar para Ações →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Dados da Trilha
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Etapa 2 de 3: Configure as informações da trilha
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Tracks
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {metadata.numTracks}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Ruler className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Distância
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {distanciaKm.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} km
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Duração
            </span>
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
            {Math.floor(duracaoMinutos / 60)}h {duracaoMinutos % 60}min
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
              Waypoints
            </span>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            {metadata.numWaypoints}
          </p>
        </div>
      </div>

      {/* Mapa - Instrução */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              Visualização no Mapa
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              A trilha será exibida no mapa ao lado com destaque. Use o zoom para visualizar detalhes.
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
        <h4 className="font-semibold text-neutral-900 dark:text-neutral-50">
          Informações da Trilha
        </h4>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="trilha-nome" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nome da Trilha <span className="text-red-500">*</span>
          </Label>
          <Input
            id="trilha-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Trilha Principal - Rio da Prata"
            className="h-11"
          />
        </div>

        {/* Data Início */}
        <div className="space-y-2">
          <Label htmlFor="trilha-inicio" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data e Hora de Início
          </Label>
          <Input
            id="trilha-inicio"
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Opcional. Extraído automaticamente do GPX.
          </p>
        </div>

        {/* Data Fim */}
        <div className="space-y-2">
          <Label htmlFor="trilha-fim" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data e Hora de Fim
          </Label>
          <Input
            id="trilha-fim"
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Opcional. Extraído automaticamente do GPX.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-6"
        >
          ← Voltar
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          className="h-11 px-8 gap-2"
        >
          Próximo →
        </Button>
      </div>
    </div>
  );
}
