"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WaypointAccordion } from "./WaypointAccordion";
import { WaypointBulkActions } from "./WaypointBulkActions";

interface PhotoFile {
  file: File;
  preview: string;
  descricao: string;
}

interface WaypointGpxData {
  nome: string | null;
  lat: number;
  lon: number;
  ele: number;
  recordedat: string | null;
}

interface WaypointFormState {
  nome: string;
  acao: string;
  descricao: string;
  categoria: string;
  tipo: string;
  status: string;
  eixoTematico: string;
  tipoTecnico: string;
  carater: string;
  fotos: PhotoFile[];
}

interface Step3Props {
  waypoints: WaypointGpxData[];
  nomeImportacao: string;
  regiaoId: number;
  onSubmit: (data: {
    waypoints: (WaypointGpxData & WaypointFormState)[];
  }) => void;
  onBack: () => void;
  onWaypointRemoved?: (index: number) => void;
}

export function Step3Waypoints({ waypoints, nomeImportacao, regiaoId, onSubmit, onBack, onWaypointRemoved }: Step3Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<number[]>([]);
  const [lastRemovedIndex, setLastRemovedIndex] = useState<number | null>(null);

  // Inicializar estado de todos os waypoints
  // removedIndexes rastreia waypoints marcados para remoção
  const [removedIndexes, setRemovedIndexes] = useState<Set<number>>(new Set());
  const [waypointsData, setWaypointsData] = useState<WaypointFormState[]>(
    waypoints.map((wp, index) => ({
      nome: wp.nome || `Waypoint ${index + 1}`,
      acao: "",
      descricao: "",
      categoria: "",
      tipo: "",
      status: "",
      eixoTematico: "",
      tipoTecnico: "",
      carater: "",
      fotos: [],
    }))
  );

  // Remover waypoint
  const handleDelete = useCallback(
    (index: number) => {
      setRemovedIndexes((prev) => new Set([...prev, index]));
      setLastRemovedIndex(index);
      
      // Notificar o mapa sobre a remoção
      if (onWaypointRemoved) {
        onWaypointRemoved(index);
      }
      
      // Fechar toast após 3 segundos
      setTimeout(() => setLastRemovedIndex(null), 3000);
    },
    [onWaypointRemoved]
  );

  // Atualizar waypoint individual
  const handleWaypointChange = useCallback(
    (index: number, data: Partial<WaypointFormState>) => {
      setWaypointsData((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...data };
        return updated;
      });
    },
    []
  );

  // Bulk apply
  const handleBulkApply = useCallback(
    (bulkData: any, fields: string[]) => {
      setWaypointsData((prev) =>
        prev.map((wp, index) => {
          // Não aplicar em waypoints removidos
          if (removedIndexes.has(index)) return wp;
          
          const updated = { ...wp };
          fields.forEach((field) => {
            // Apenas preencher campos vazios
            if (!updated[field as keyof WaypointFormState]) {
              updated[field as keyof WaypointFormState] = bulkData[field];
            }
          });
          return updated;
        })
      );
    },
    [removedIndexes]
  );

  // Validar waypoint individual
  const validateWaypoint = (wp: WaypointFormState): string[] => {
    const errors: string[] = [];
    
    // Debug individual
    console.log(`🔎 Validando waypoint:`, {
      nome: wp.nome,
      nomeLen: wp.nome?.trim().length,
      acao: wp.acao,
      descricao: wp.descricao,
      descricaoLen: wp.descricao?.trim().length,
      categoria: wp.categoria,
      tipo: wp.tipo,
      tipoLen: wp.tipo?.trim().length,
      status: wp.status,
      eixoTematico: wp.eixoTematico,
      tipoTecnico: wp.tipoTecnico,
      carater: wp.carater,
    });
    
    if (!wp.nome || wp.nome.trim().length < 3) {
      console.log("  ❌ Nome falhou:", wp.nome);
      errors.push("Nome");
    }
    if (!wp.acao) {
      console.log("  ❌ Ação falhou:", wp.acao);
      errors.push("Ação");
    }
    // Descrição é opcional - não validar
    if (!wp.categoria) {
      console.log("  ❌ Categoria falhou:", wp.categoria);
      errors.push("Categoria");
    }
    if (!wp.tipo || wp.tipo.trim().length < 3) {
      console.log("  ❌ Tipo falhou:", wp.tipo);
      errors.push("Tipo");
    }
    if (!wp.status) {
      console.log("  ❌ Status falhou:", wp.status);
      errors.push("Status");
    }
    if (!wp.eixoTematico) {
      console.log("  ❌ Eixo Temático falhou:", wp.eixoTematico);
      errors.push("Eixo Temático");
    }
    if (!wp.tipoTecnico) {
      console.log("  ❌ Tipo Técnico falhou:", wp.tipoTecnico);
      errors.push("Tipo Técnico");
    }
    if (!wp.carater) {
      console.log("  ❌ Caráter falhou:", wp.carater);
      errors.push("Caráter");
    }
    
    if (errors.length === 0) {
      console.log("  ✅ Waypoint válido!");
    }
    
    return errors;
  };

  // Validar todos e submeter
  const handleSubmit = async () => {
    setError(null);
    setValidationErrors([]);

    // Filtrar waypoints não removidos
    const activeWaypoints = waypoints
      .map((wp, index) => ({ ...wp, dataIndex: index }))
      .filter((_, index) => !removedIndexes.has(index));

    const errors: number[] = [];
    const allErrors: { index: number; field: string; message: string }[] = [];
    
    activeWaypoints.forEach((wp) => {
      const wpData = waypointsData[wp.dataIndex];
      const wpErrors = validateWaypoint(wpData);
      if (wpErrors.length > 0) {
        errors.push(wp.dataIndex);
        wpErrors.forEach((msg) => {
          allErrors.push({ index: wp.dataIndex, field: "", message: msg });
        });
      }
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      setOpenIndex(errors[0]); // Abrir primeiro com erro
      
      // Montar mensagem detalhada por waypoint
      const mensagens = errors.map((idx) => {
        const wpErrors = validateWaypoint(waypointsData[idx]);
        return `Waypoint ${idx + 1}: ${wpErrors.join(", ")}`;
      });
      
      console.log("🔍 Erros de validação detalhados:");
      errors.forEach((idx) => {
        console.log(`  Waypoint ${idx + 1}:`, waypointsData[idx]);
      });
      
      setError(
        `${errors.length} waypoint(s) com pendências:\n${mensagens.join("\n")}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const completeData = activeWaypoints.map((wp) => ({
        ...wp,
        ...waypointsData[wp.dataIndex],
      }));

      onSubmit({ waypoints: completeData });
    } catch {
      setError("Erro ao enviar dados. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Contar waypoints completos (apenas ativos)
  const activeWaypointsCount = waypoints.length - removedIndexes.size;
  const completeCount = waypoints
    .map((_, index) => ({ index, removed: removedIndexes.has(index) }))
    .filter(({ removed }) => !removed)
    .filter(({ index }) => validateWaypoint(waypointsData[index]).length === 0).length;
  const totalCount = activeWaypointsCount;
  const allComplete = completeCount === totalCount && totalCount > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
              Classificação de Waypoints como Ações
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Etapa 3 de 3: Preencha os campos obrigatórios para cada ponto
            </p>
          </div>

          {/* Progress Badge */}
          <div className="shrink-0">
            <div
              className={`
                px-4 py-2 rounded-full text-sm font-bold
                ${
                  allComplete
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                }
              `}
            >
              {completeCount}/{totalCount} completos
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Removed Waypoint Toast */}
      {lastRemovedIndex !== null && (
        <Alert className="bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700">
          <AlertCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          <AlertDescription className="text-neutral-700 dark:text-neutral-300">
            Waypoint {lastRemovedIndex + 1} removido com sucesso
          </AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      {activeWaypointsCount > 0 && (
        <WaypointBulkActions
          totalWaypoints={activeWaypointsCount}
          onApply={handleBulkApply}
        />
      )}

      {/* Waypoints List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {waypoints
          .map((wp, index) => ({ wp, index }))
          .filter(({ index }) => !removedIndexes.has(index))
          .map(({ wp, index }) => (
            <WaypointAccordion
              key={index}
              waypoint={{
                index,
                lat: wp.lat,
                lon: wp.lon,
                ele: wp.ele,
                recordedat: wp.recordedat || undefined,
                ...waypointsData[index],
              }}
              onChange={(data) => handleWaypointChange(index, data)}
              onDelete={() => handleDelete(index)}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-6"
          disabled={isSubmitting}
        >
          ← Voltar
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-11 px-8 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Enviar Tudo ✓
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
