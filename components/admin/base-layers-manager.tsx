"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Edit2, Check, X } from "lucide-react";

export interface BaseLayerDto {
  id: number;
  name: string;
  slug: string;
  visualConfig: any;
  regiaoId: number | null;
  geojson?: any;
}

export function BaseLayersManager({
  regionId,
  layers,
  onLayerUpdate
}: {
  regionId: number;
  layers: BaseLayerDto[];
  onLayerUpdate: () => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editWeight, setEditWeight] = useState<number>(2);
  const [editOpacity, setEditOpacity] = useState<number>(0.2);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleEditClick = (layer: BaseLayerDto) => {
    setEditingId(layer.id);
    setEditName(layer.name);
    setEditColor(layer.visualConfig?.baseStyle?.color || "#000000");
    setEditWeight(layer.visualConfig?.baseStyle?.weight || 2);
    setEditOpacity(layer.visualConfig?.baseStyle?.fillOpacity || 0.2);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (layer: BaseLayerDto) => {
    setIsSaving(true);
    try {
      const updatedVisualConfig = {
        ...layer.visualConfig,
        baseStyle: {
          ...layer.visualConfig?.baseStyle,
          color: editColor,
          weight: editWeight,
          fillOpacity: editOpacity
        }
      };

      const res = await fetch(`/api/admin/layers/${layer.id}/visual`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          visualConfig: updatedVisualConfig
        })
      });

      if (!res.ok) throw new Error("Failed to update layer");

      onLayerUpdate();
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar alterações na camada.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (layer: BaseLayerDto, checked: boolean) => {
    try {
      const updatedVisualConfig = {
        ...layer.visualConfig,
        defaultVisibility: checked
      };

      await fetch(`/api/admin/layers/${layer.id}/visual`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: layer.name,
          visualConfig: updatedVisualConfig
        })
      });
      onLayerUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta camada base? Esta ação não pode ser desfeita.")) return;

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/admin/layers/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete");
      onLayerUpdate();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir camada.");
    } finally {
      setIsDeleting(null);
    }
  };

  if (!layers || layers.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 text-center text-neutral-500 text-sm shadow-sm">
        Nenhuma camada de Base Territorial criada para esta região.
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/50">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">Gerenciador de Camadas Base</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Camadas territoriais visíveis sobrepostas à região principal.</p>
        </div>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
        {layers.map(layer => {
          const isEditing = editingId === layer.id;
          const color = layer.visualConfig?.baseStyle?.color || "#000000";
          const isVisible = layer.visualConfig?.defaultVisibility !== false;

          return (
            <div key={layer.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">

              {/* Info / Edit Fields */}
              <div className="flex items-center gap-4 flex-1 w-full">
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-3 w-full items-start sm:items-center">
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full sm:max-w-xs h-9"
                      placeholder="Nome da camada"
                    />
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-md">
                      <Input
                        type="color"
                        value={editColor}
                        onChange={e => setEditColor(e.target.value)}
                        className="w-8 h-8 p-0 border-0 cursor-pointer rounded overflow-hidden"
                        title="Cor da linha"
                      />
                      <Input
                        type="number"
                        value={editWeight}
                        onChange={e => setEditWeight(Number(e.target.value))}
                        min={1} max={10}
                        className="w-16 h-8 text-xs"
                        title="Espessura da linha"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-6 h-6 rounded-full border shadow-inner flex-shrink-0"
                      style={{ backgroundColor: color, borderColor: color, opacity: layer.visualConfig?.baseStyle?.fillOpacity || 0.5 }}
                    />
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate flex-1">
                      {layer.name}
                    </span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                {isEditing ? (
                   <div className="flex gap-2">
                     <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                       <X className="w-4 h-4 text-neutral-500" />
                     </Button>
                     <Button size="sm" onClick={() => handleSaveEdit(layer)} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                     </Button>
                   </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 pr-4 border-r dark:border-neutral-700">
                      <span className="text-xs font-medium text-neutral-500">Visível</span>
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(c) => handleToggleVisibility(layer, c)}
                      />
                    </div>

                    <Button size="sm" variant="ghost" onClick={() => handleEditClick(layer)} className="h-8 w-8 p-0 text-neutral-500 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button size="sm" variant="ghost" onClick={() => handleDelete(layer.id)} disabled={isDeleting === layer.id} className="h-8 w-8 p-0 text-neutral-500 hover:text-red-600">
                      {isDeleting === layer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
