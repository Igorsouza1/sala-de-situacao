"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertyDto } from "./properties-manager";
import { Loader2 } from "lucide-react";

interface PropertyEditDialogProps {
  property: PropertyDto | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  regionId: number;
}

export function PropertyEditDialog({ property, isOpen, onOpenChange, onSaved, regionId }: PropertyEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    cadastrante: "",
    area_imovel: "",
    data_registro: "",
    data_ultima_retificacao: "",
    situacao_reserva_legal: "",
    area_remanescente: "",
    area_uso_consolidado: "",
  });

  useEffect(() => {
    if (property) {
      setFormData({
        nome: property.nome || "",
        cadastrante: property.properties?.cadastrante || "",
        area_imovel: property.properties?.area_imovel || "",
        data_registro: property.properties?.data_registro || "",
        data_ultima_retificacao: property.properties?.data_ultima_retificacao || "",
        situacao_reserva_legal: property.properties?.situacao_reserva_legal || "",
        area_remanescente: property.properties?.area_remanescente || "",
        area_uso_consolidado: property.properties?.area_uso_consolidado || "",
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: formData.nome,
          properties: {
            ...property.properties,
            cadastrante: formData.cadastrante,
            area_imovel: formData.area_imovel,
            data_registro: formData.data_registro,
            data_ultima_retificacao: formData.data_ultima_retificacao,
            situacao_reserva_legal: formData.situacao_reserva_legal,
            area_remanescente: formData.area_remanescente,
            area_uso_consolidado: formData.area_uso_consolidado,
          }
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Erro ao salvar propriedade.");
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Save failed:", error);
      alert(error instanceof Error ? error.message : "Erro desconhecido ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Propriedade</DialogTitle>
          <DialogDescription>
            ID: {property?.id} {property?.codImovel ? `| CAR: ${property.codImovel}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cadastrante">Cadastrante</Label>
            <Input id="cadastrante" name="cadastrante" value={formData.cadastrante} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_imovel">Área do Imóvel</Label>
            <Input id="area_imovel" name="area_imovel" value={formData.area_imovel} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_registro">Data de Registro</Label>
            <Input id="data_registro" name="data_registro" value={formData.data_registro} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data_ultima_retificacao">Data da Última Retificação</Label>
            <Input id="data_ultima_retificacao" name="data_ultima_retificacao" value={formData.data_ultima_retificacao} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="situacao_reserva_legal">Situação da Reserva Legal</Label>
            <Input id="situacao_reserva_legal" name="situacao_reserva_legal" value={formData.situacao_reserva_legal} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_remanescente">Área de Remanescente de Vegetação Nativa</Label>
            <Input id="area_remanescente" name="area_remanescente" value={formData.area_remanescente} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_uso_consolidado">Área de Uso Consolidado</Label>
            <Input id="area_uso_consolidado" name="area_uso_consolidado" value={formData.area_uso_consolidado} onChange={handleChange} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
