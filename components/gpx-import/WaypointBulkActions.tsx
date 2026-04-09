"use client";

import { useState } from "react";
import { Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BulkFormData {
  categoria: string;
  status: string;
  eixoTematico: string;
  tipoTecnico: string;
  carater: string;
}

interface WaypointBulkActionsProps {
  totalWaypoints: number;
  onApply: (data: BulkFormData, fields: string[]) => void;
}

const CATEGORIA_OPTIONS = ["Fiscalização", "Recuperação", "Incidente", "Monitoramento", "Infraestrutura"];
const STATUS_OPTIONS = ["Identificado", "Em Recuperação", "Concluído"];
const EIXO_TEMATICO_OPTIONS = CATEGORIA_OPTIONS;
const TIPO_TECNICO_OPTIONS = CATEGORIA_OPTIONS;
const CARATER_OPTIONS = CATEGORIA_OPTIONS;

export function WaypointBulkActions({ totalWaypoints, onApply }: WaypointBulkActionsProps) {
  const [categoria, setCategoria] = useState("");
  const [status, setStatus] = useState("");
  const [eixoTematico, setEixoTematico] = useState("");
  const [tipoTecnico, setTipoTecnico] = useState("");
  const [carater, setCarater] = useState("");
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  const handleApply = () => {
    const fields: string[] = [];
    const data: BulkFormData = {
      categoria: "",
      status: "",
      eixoTematico: "",
      tipoTecnico: "",
      carater: "",
    };

    if (categoria) { data.categoria = categoria; fields.push("categoria"); }
    if (status) { data.status = status; fields.push("status"); }
    if (eixoTematico) { data.eixoTematico = eixoTematico; fields.push("eixoTematico"); }
    if (tipoTecnico) { data.tipoTecnico = tipoTecnico; fields.push("tipoTecnico"); }
    if (carater) { data.carater = carater; fields.push("carater"); }

    if (fields.length === 0) return;

    onApply(data, fields);
    setAppliedCount(totalWaypoints);
    
    // Reset after 3 seconds
    setTimeout(() => setAppliedCount(null), 3000);
  };

  const handleReset = () => {
    setCategoria("");
    setStatus("");
    setEixoTematico("");
    setTipoTecnico("");
    setCarater("");
    setAppliedCount(null);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
              Aplicar em Lote
            </h4>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Preenche apenas campos vazios em {totalWaypoints} waypoint(s)
            </p>
          </div>
        </div>

        {appliedCount !== null && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-semibold">{appliedCount} atualizado(s)</span>
          </div>
        )}
      </div>

      {/* Bulk Form Fields */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-medium text-amber-900 dark:text-amber-300">Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIA_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-amber-900 dark:text-amber-300">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-amber-900 dark:text-amber-300">Eixo Temático</Label>
          <Select value={eixoTematico} onValueChange={setEixoTematico}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent>
              {EIXO_TEMATICO_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-amber-900 dark:text-amber-300">Tipo Técnico</Label>
          <Select value={tipoTecnico} onValueChange={setTipoTecnico}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent>
              {TIPO_TECNICO_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-amber-900 dark:text-amber-300">Caráter</Label>
          <Select value={carater} onValueChange={setCarater}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="..." />
            </SelectTrigger>
            <SelectContent>
              {CARATER_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-8 text-xs"
        >
          Limpar
        </Button>
        <Button
          type="button"
          onClick={handleApply}
          disabled={![categoria, status, eixoTematico, tipoTecnico, carater].some(Boolean)}
          className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Aplicar a Todos
        </Button>
      </div>
    </div>
  );
}
