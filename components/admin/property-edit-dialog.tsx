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

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-2 pb-1 border-b border-neutral-200 dark:border-neutral-700">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{title}</p>
    </div>
  );
}

export function PropertyEditDialog({ property, isOpen, onOpenChange, onSaved, regionId }: PropertyEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    // Identificação
    nome: "",
    // Dados existentes
    cadastrante: "",
    area_imovel: "",
    data_registro: "",
    data_ultima_retificacao: "",
    situacao_reserva_legal: "",
    area_remanescente: "",
    area_uso_consolidado: "",
    // Dados de Contato
    endereco: "",
    complemento: "",
    bairro: "",
    municipio_contato: "",
    email: "",
    telefone: "",
    // Cadastrante
    cadastrante_cpf: "",
    cadastrante_nome: "",
    // Titulares
    titular_cpf_cnpj: "",
    titular_nome: "",
    // Documentos / CAR
    tipo_imovel: "",
    denominacao: "",
    matricula: "",
    deseja_aderir_pra: "",
    possui_deficit_rl: "",
    existe_tac: "",
    existe_prad: "",
    existe_infracao: "",
    possui_excedente_vegetacao_nativa: "",
    existe_rppn: "",
    possui_crf: "",
    rl_temporalidade: "",
    tamanho_alterado_apos_2008: "",
  });

  useEffect(() => {
    if (property) {
      const p = property.properties || {};
      setFormData({
        nome: property.nome || "",
        cadastrante: p.cadastrante || "",
        area_imovel: p.area_imovel || "",
        data_registro: p.data_registro || "",
        data_ultima_retificacao: p.data_ultima_retificacao || "",
        situacao_reserva_legal: p.situacao_reserva_legal || "",
        area_remanescente: p.area_remanescente || "",
        area_uso_consolidado: p.area_uso_consolidado || "",
        endereco: p.endereco || "",
        complemento: p.complemento || "",
        bairro: p.bairro || "",
        municipio_contato: p.municipio_contato || "",
        email: p.email || "",
        telefone: p.telefone || "",
        cadastrante_cpf: p.cadastrante_cpf || "",
        cadastrante_nome: p.cadastrante_nome || "",
        titular_cpf_cnpj: p.titular_cpf_cnpj || "",
        titular_nome: p.titular_nome || "",
        tipo_imovel: p.tipo_imovel || "",
        denominacao: p.denominacao || "",
        matricula: p.matricula || "",
        deseja_aderir_pra: p.deseja_aderir_pra || "",
        possui_deficit_rl: p.possui_deficit_rl || "",
        existe_tac: p.existe_tac || "",
        existe_prad: p.existe_prad || "",
        existe_infracao: p.existe_infracao || "",
        possui_excedente_vegetacao_nativa: p.possui_excedente_vegetacao_nativa || "",
        existe_rppn: p.existe_rppn || "",
        possui_crf: p.possui_crf || "",
        rl_temporalidade: p.rl_temporalidade || "",
        tamanho_alterado_apos_2008: p.tamanho_alterado_apos_2008 || "",
      });
    }
  }, [property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setIsSaving(true);
    try {
      const { nome, ...rest } = formData;
      const response = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          properties: { ...property.properties, ...rest },
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

  const field = (id: keyof typeof formData, label: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} value={formData[id]} onChange={handleChange} />
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>Editar Propriedade</DialogTitle>
          <DialogDescription>
            ID: {property?.id} {property?.codImovel ? `| CAR: ${property.codImovel}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">

          <SectionHeader title="Identificação" />
          <div className="grid grid-cols-2 gap-3">
            {field("nome", "Nome / Denominação")}
            {field("tipo_imovel", "Tipo de Imóvel")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("denominacao", "Denominação (CAR)")}
            {field("matricula", "Matrícula")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("area_imovel", "Área do Imóvel")}
            {field("data_registro", "Data de Registro")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("data_ultima_retificacao", "Data da Última Retificação")}
            {field("situacao_reserva_legal", "Situação da Reserva Legal")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("area_remanescente", "Área Remanescente de Veg. Nativa")}
            {field("area_uso_consolidado", "Área de Uso Consolidado")}
          </div>

          <SectionHeader title="Dados de Contato" />
          {field("endereco", "Endereço")}
          {field("complemento", "Complemento")}
          <div className="grid grid-cols-2 gap-3">
            {field("bairro", "Bairro")}
            {field("municipio_contato", "Município")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("email", "Email")}
            {field("telefone", "Telefone")}
          </div>

          <SectionHeader title="Cadastrante" />
          <div className="grid grid-cols-2 gap-3">
            {field("cadastrante_cpf", "CPF do Cadastrante")}
            {field("cadastrante_nome", "Nome do Cadastrante")}
          </div>
          {field("cadastrante", "Cadastrante (legado)")}

          <SectionHeader title="Titulares" />
          <div className="grid grid-cols-2 gap-3">
            {field("titular_cpf_cnpj", "CPF/CNPJ do Titular")}
            {field("titular_nome", "Nome do Titular")}
          </div>

          <SectionHeader title="Documentos / Informações CAR" />
          <div className="grid grid-cols-2 gap-3">
            {field("deseja_aderir_pra", "Deseja Aderir PRA")}
            {field("possui_deficit_rl", "Possui Déficit RL")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("existe_tac", "Existe TAC")}
            {field("existe_prad", "Existe PRAD")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("existe_infracao", "Existe Infração")}
            {field("possui_excedente_vegetacao_nativa", "Possui Excedente Veg. Nativa")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("existe_rppn", "Existe RPPN")}
            {field("possui_crf", "Possui CRF")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("rl_temporalidade", "RL Temporalidade (período a partir de)")}
            {field("tamanho_alterado_apos_2008", "Tamanho Alterado Após 2008")}
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
