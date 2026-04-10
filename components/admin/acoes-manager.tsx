"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Camera, ImagePlus, Loader2, MapPin, Calendar } from "lucide-react";

export interface AcaoDto {
  id: number;
  name: string | null;
  descricao: string | null;
  time: string | null;
  acao: string | null;
  categoria: string | null;
  tipo: string | null;
  status: string | null;
  eixoTematico: string | null;
  tipoTecnico: string | null;
  carater: string | null;
  latitude: string | null;
  longitude: string | null;
  elevation: string | null;
  ultimaFotoUrl: string | null;
  totalFotos: number;
}

interface AcoesManagerProps {
  regionId: number;
  acoes: AcaoDto[];
}

export function AcoesManager({ regionId, acoes }: AcoesManagerProps) {
  const [uploadingAcaoId, setUploadingAcaoId] = useState<number | null>(null);
  const [openPhotoDialog, setOpenPhotoDialog] = useState<number | null>(null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const handlePhotoUpload = async (acaoId: number, photos: File[]) => {
    setUploadingAcaoId(acaoId);
    try {
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("file", photo);
        formData.append("descricao", "");

        const response = await fetch(`/api/acoes/${acaoId}/upload-photo`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Falha no upload");
        }
      }
      // Recarregar página para atualizar dados
      window.location.reload();
    } catch (error) {
      console.error("Erro no upload:", error);
      alert(error instanceof Error ? error.message : "Erro ao fazer upload da foto");
    } finally {
      setUploadingAcaoId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 items-center flex-1">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-blue-100 dark:border-blue-900/50">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 leading-tight">
              Ações da Região
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {acoes.length} ação(ões) registrada(s)
            </p>
          </div>
        </div>
      </div>

      {/* Tabela */}
      {acoes.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 shadow-sm text-center">
          <MapPin className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Nenhuma ação registrada
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            Use a importação GPX para adicionar ações a esta região.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 dark:bg-neutral-800/50">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Descrição</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Ação</TableHead>
                  <TableHead className="font-semibold">Tipo Técnico</TableHead>
                  <TableHead className="font-semibold">Caráter</TableHead>
                  <TableHead className="font-semibold text-center">Fotos</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {acoes.map((acao) => (
                  <TableRow key={acao.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <TableCell className="font-medium max-w-[180px] truncate">
                      {acao.name || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-neutral-600 dark:text-neutral-400">
                      {acao.descricao || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {formatDate(acao.time)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {acao.acao || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{acao.tipoTecnico || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={acao.carater === "Ativo" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {acao.carater || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {acao.ultimaFotoUrl ? (
                          <img
                            src={acao.ultimaFotoUrl}
                            alt="Última foto"
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                            <Camera className="w-5 h-5 text-neutral-400" />
                          </div>
                        )}
                        <span className="text-xs text-neutral-500">
                          {acao.totalFotos}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog open={openPhotoDialog === acao.id} onOpenChange={(open) => setOpenPhotoDialog(open ? acao.id : null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 h-8"
                            >
                              <ImagePlus className="w-3.5 h-3.5" />
                              Fotos
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Fotos - {acao.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              {acao.ultimaFotoUrl && (
                                <img
                                  src={acao.ultimaFotoUrl}
                                  alt={acao.name || "Ação"}
                                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                                />
                              )}
                              <div>
                                <label className="block text-sm font-medium mb-2">
                                  Adicionar Fotos
                                </label>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  multiple
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length > 0) {
                                      handlePhotoUpload(acao.id, files);
                                    }
                                  }}
                                  disabled={uploadingAcaoId === acao.id}
                                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                                />
                                {uploadingAcaoId === acao.id && (
                                  <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Enviando fotos...
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
