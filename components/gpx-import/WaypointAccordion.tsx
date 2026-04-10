"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, MapPin, AlertCircle, CheckCircle2, Calendar, Ruler, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhotoUploader } from "./PhotoUploader";
import {
  ACAO_OPTIONS,
  CATEGORIA_OPTIONS,
  TIPO_OPTIONS,
  STATUS_OPTIONS,
  EIXO_TEMATICO_OPTIONS,
  TIPO_TECNICO_OPTIONS,
  CARATER_OPTIONS,
} from "./waypoint-constants";

interface PhotoFile {
  file: File;
  preview: string;
  descricao: string;
}

interface WaypointData {
  index: number;
  nome: string;
  lat: number;
  lon: number;
  ele?: number;
  recordedat?: string;
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

interface WaypointAccordionProps {
  waypoint: WaypointData;
  onChange: (data: Partial<WaypointData>) => void;
  onDelete: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function WaypointAccordion({ waypoint, onChange, onDelete, isOpen, onToggle }: WaypointAccordionProps) {
  const hasErrors = !waypoint.nome || waypoint.nome.length < 3 ||
                    !waypoint.acao ||
                    !waypoint.descricao || waypoint.descricao.length < 10 ||
                    !waypoint.categoria || !waypoint.tipo || waypoint.tipo.length < 3 ||
                    !waypoint.status || !waypoint.eixoTematico || !waypoint.tipoTecnico || !waypoint.carater;

  const isComplete = !hasErrors;

  const getStatusIcon = () => {
    if (isComplete && isOpen) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    }
    if (hasErrors && !isOpen) {
      return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    }
    return null;
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden transition-all">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`
          w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
          ${isOpen
            ? "bg-blue-50 dark:bg-blue-950/20 border-b border-neutral-200 dark:border-neutral-700"
            : "bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800"
          }
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
          )}
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className={`w-4 h-4 shrink-0 ${isOpen ? "text-blue-600 dark:text-blue-400" : "text-neutral-400"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isOpen ? "text-blue-900 dark:text-blue-300" : "text-neutral-900 dark:text-neutral-50"}`}>
                {waypoint.nome || `Waypoint ${waypoint.index + 1}`}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                📍 {waypoint.lat.toFixed(6)}, {waypoint.lon.toFixed(6)}
                {waypoint.ele && waypoint.ele > 0 && ` • ${waypoint.ele.toFixed(0)}m`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getStatusIcon()}
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
            {isComplete ? "Completo" : "Pendente"}
          </span>
          
          {/* Botão de Remover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="ml-2 p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Remover waypoint"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="bg-white dark:bg-neutral-900 p-5 space-y-5 animate-in slide-in-from-top-1 duration-200">
          {/* Coordenadas (Read-only) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-neutral-50 dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Latitude</p>
              <p className="text-sm font-mono font-semibold text-neutral-900 dark:text-neutral-50">{waypoint.lat.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Longitude</p>
              <p className="text-sm font-mono font-semibold text-neutral-900 dark:text-neutral-50">{waypoint.lon.toFixed(6)}</p>
            </div>
            {waypoint.ele && waypoint.ele > 0 && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Elevação</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{waypoint.ele.toFixed(1)}m</p>
              </div>
            )}
            {waypoint.recordedat && (
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Data/Hora</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {new Date(waypoint.recordedat).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
            )}
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor={`wp-nome-${waypoint.index}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`wp-nome-${waypoint.index}`}
              value={waypoint.nome}
              onChange={(e) => onChange({ nome: e.target.value })}
              placeholder={`Ex: Ponto de Coleta ${waypoint.index + 1}`}
              className="h-10"
            />
          </div>

          {/* Ação */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Ação <span className="text-red-500">*</span>
            </Label>
            <Select value={waypoint.acao} onValueChange={(v) => onChange({ acao: v })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {ACAO_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor={`wp-desc-${waypoint.index}`} className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id={`wp-desc-${waypoint.index}`}
              value={waypoint.descricao}
              onChange={(e) => onChange({ descricao: e.target.value })}
              placeholder="Descreva o que foi observado neste ponto..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Categoria e Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Categoria <span className="text-red-500">*</span>
              </Label>
              <Select value={waypoint.categoria} onValueChange={(v) => onChange({ categoria: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIA_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select value={waypoint.status} onValueChange={(v) => onChange({ status: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <Select value={waypoint.tipo} onValueChange={(v) => onChange({ tipo: v })}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {TIPO_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eixo Temático, Tipo Técnico, Caráter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Eixo Temático <span className="text-red-500">*</span>
              </Label>
              <Select value={waypoint.eixoTematico} onValueChange={(v) => onChange({ eixoTematico: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {EIXO_TEMATICO_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Tipo Técnico <span className="text-red-500">*</span>
              </Label>
              <Select value={waypoint.tipoTecnico} onValueChange={(v) => onChange({ tipoTecnico: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_TECNICO_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Caráter <span className="text-red-500">*</span>
              </Label>
              <Select value={waypoint.carater} onValueChange={(v) => onChange({ carater: v })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {CARATER_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fotos */}
          <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              📷 Fotos (opcional, máx 2)
            </Label>
            <PhotoUploader
              photos={waypoint.fotos}
              onPhotosChange={(fotos) => onChange({ fotos })}
              maxPhotos={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}
