"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, Edit2, Check, Layers, EyeOff, Eye } from "lucide-react";
import { Label } from "@/components/ui/label";
import { readEdit } from "@/lib/layer-style";

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

  // Grava pela rota única de edição de camada (valida, confere papel e organização, e põe a aparência nos dois lugares
  // do catálogo: antes só o baseStyle era gravado, e o mapa principal desenha com o maplibre.paint, então a edição não aparecia).
  const saveLayer = async (layer: BaseLayerDto, patch: { name?: string; color?: string; weight?: number; fillOpacity?: number; defaultVisibility?: boolean }) => {
    const current = readEdit({ name: layer.name, visualConfig: layer.visualConfig });
    const edit = {
      ...current,
      name: patch.name ?? current.name,
      defaultVisibility: patch.defaultVisibility ?? current.defaultVisibility,
      style: {
        ...current.style,
        color: patch.color ?? current.style.color,
        weight: patch.weight ?? current.style.weight,
        fillOpacity: patch.fillOpacity ?? current.style.fillOpacity,
      },
    };
    const res = await fetch(`/api/admin/layer-catalog/${layer.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    });
    if (!res.ok) throw new Error("Failed to update layer");
  };

  const handleSaveEdit = async (layer: BaseLayerDto) => {
    setIsSaving(true);
    try {
      await saveLayer(layer, { name: editName, color: editColor, weight: editWeight, fillOpacity: editOpacity });
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
      await saveLayer(layer, { defaultVisibility: checked });
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
      <div className="w-full h-full bg-white border border-neutral-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs">
        <Layers className="w-12 h-12 text-neutral-300 mb-4" />
        <h3 className="font-semibold text-neutral-700">Nenhuma camada Base</h3>
        <p className="text-neutral-500 text-sm mt-1 max-w-[200px]">Faça upload de um arquivo para começar a configurar sobreposições.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
      {/* Header stuck to top */}
      <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center bg-white shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Camadas Ativas
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">Gerencie visibilidade e limites</p>
        </div>
      </div>

      {/* List container */}
      <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-neutral-50/50 styling-scrollbar">
        {layers.map(layer => {
          const isEditing = editingId === layer.id;
          const color = layer.visualConfig?.baseStyle?.color || "#000000";
          const isVisible = layer.visualConfig?.defaultVisibility !== false;

          return (
            <div 
              key={layer.id} 
              className={`rounded-xl border transition-all duration-300 ease-in-out ${
                isEditing 
                  ? 'border-emerald-200 bg-white shadow-lg ring-1 ring-emerald-500/20' 
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
              }`}
            >
              {isEditing ? (
                 <div className="p-5 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-neutral-500">Novo Nome</Label>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-10 font-bold bg-neutral-50 border-neutral-200 focus-visible:ring-emerald-500 shadow-xs"
                        placeholder="Nome desta camada"
                        autoFocus
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="space-y-1.5 flex flex-col items-start w-full">
                          <Label className="text-xs font-semibold text-neutral-500">Cor Principal</Label>
                          <div className="flex h-10 w-full rounded-lg border border-neutral-200 bg-white p-[3px] shadow-inner items-center justify-center relative overflow-hidden group">
                              <input 
                                type="color" 
                                value={editColor} 
                                onChange={e => setEditColor(e.target.value)} 
                                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                              />
                              <div className="pointer-events-none z-10 text-[11px] font-mono text-white mix-blend-difference drop-shadow-md bg-black/30 px-2 py-0.5 rounded leading-none flex gap-1 items-center font-bold">
                                {editColor.toUpperCase()}
                              </div>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-neutral-500" title="Espessura da borda">Grossura (px)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={editWeight}
                              onChange={e => setEditWeight(Number(e.target.value))}
                              min={1} max={10}
                              className="h-10 pr-7 text-sm font-medium border-neutral-200 shadow-xs focus-visible:ring-emerald-500"
                            />
                            <span className="absolute right-3 top-3 text-xs text-neutral-400 pointer-events-none font-semibold">px</span>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-neutral-500" title="Transparência de preenchimento">Opacidade (0-100%)</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={Math.round(editOpacity * 100)}
                              onChange={e => setEditOpacity(Number(e.target.value) / 100)}
                              min={0} max={100} step={5}
                              className="h-10 pr-7 text-sm font-medium border-neutral-200 shadow-xs focus-visible:ring-emerald-500"
                            />
                            <span className="absolute right-3 top-3 text-xs text-neutral-400 pointer-events-none font-semibold">%</span>
                          </div>
                       </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-neutral-100 mt-2">
                       <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving} className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 h-9 shrink-0 px-4 font-semibold text-xs">
                         Cancelar
                       </Button>
                       <Button size="sm" onClick={() => handleSaveEdit(layer)} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 font-semibold text-xs px-5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-transform">
                         {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Salvar Alterações
                       </Button>
                    </div>
                 </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-4 overflow-hidden flex-1 min-w-0">
                    <div className="relative shrink-0 flex items-center justify-center w-10 h-10">
                       <div
                         className="absolute inset-0 rounded-full border-[3px] shadow-xs pointer-events-none transition-colors"
                         style={{ borderColor: color, backgroundColor: `${color}20` }}
                       />
                       <div className="w-4 h-4 rounded-full shadow-inner ring-1 ring-black/10" style={{ backgroundColor: color }} />
                    </div>
                    
                    <div className="flex flex-col min-w-0 pr-2">
                       <span className={`font-bold text-[15px] truncate ${!isVisible ? 'text-neutral-400 line-through' : 'text-neutral-800'}`} title={layer.name}>
                         {layer.name}
                       </span>
                       <div className="flex items-center gap-1.5 mt-1 opacity-80">
                         <span className="w-2.5 h-2.5 rounded-full inline-block ring-1 ring-black/10 shadow-xs" style={{ backgroundColor: color }}></span>
                         <span className="text-[11px] text-neutral-500 font-mono font-medium tracking-tight">
                            {color.toUpperCase()} <span className="text-neutral-300 px-0.5">•</span> W:{layer.visualConfig?.baseStyle?.weight || 2} <span className="text-neutral-300 px-0.5">•</span> Op:{Math.round((layer.visualConfig?.baseStyle?.fillOpacity || 0.2) * 100)}%
                         </span>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 bg-neutral-50 p-1.5 rounded-xl border border-neutral-100 shadow-xs w-full sm:w-auto justify-end sm:justify-start">
                    
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleToggleVisibility(layer, !isVisible)} 
                      className={`h-8 w-8 rounded-lg shadow-xs transition-all ${isVisible ? 'bg-white border border-emerald-100 text-emerald-600 hover:bg-emerald-50' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200 bg-transparent border border-transparent'}`} 
                      title={isVisible ? "Ocultar camada e seus limites" : "Tornar de novo visível"}
                    >
                      {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 opacity-50" />}
                    </Button>

                    <div className="w-px h-5 bg-neutral-200 mx-1"></div>

                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleEditClick(layer)} 
                      className="h-8 w-8 rounded-lg text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" 
                      title="Editar estilização técnica"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>

                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDelete(layer.id)} 
                      disabled={isDeleting === layer.id} 
                      className="h-8 w-8 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors" 
                      title="Apagar permanentemente"
                    >
                      {isDeleting === layer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>

                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
