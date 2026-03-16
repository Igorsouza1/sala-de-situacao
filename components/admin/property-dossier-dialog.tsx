"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PropertyDto } from "./properties-manager";
import { FileText, MapPin, BarChart3, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface PropertyDossierDialogProps {
  property: PropertyDto | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  AT: { label: "Ativo", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CA: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
  PE: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  SU: { label: "Suspenso", color: "bg-orange-100 text-orange-800 border-orange-200" },
};

const TIPO_MAP: Record<string, string> = {
  IRU: "Imóvel Rural",
  IRB: "Imóvel Rural (Beneficiário)",
  POD: "Pousio / Domínio Público",
};

function StatusBadge({ code }: { code?: string | null }) {
  if (!code) return null;
  const entry = STATUS_MAP[code.toUpperCase()] ?? { label: code, color: "bg-neutral-100 text-neutral-700 border-neutral-200" };
  const Icon = code.toUpperCase() === "AT" ? CheckCircle2 : code.toUpperCase() === "CA" ? XCircle : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${entry.color}`}>
      <Icon className="w-3 h-3" /> {entry.label}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-xs text-neutral-500 shrink-0 w-[48%]">{label}</span>
      <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 text-right">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{title}</span>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

export function PropertyDossierDialog({ property, isOpen, onOpenChange }: PropertyDossierDialogProps) {
  if (!property) return null;

  const p = property.properties ?? {};
  const isAtivo = p.ind_status?.toUpperCase() === "AT";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Dados Cadastrais
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <code className="font-mono text-xs">{property.codImovel || "—"}</code>
            {p.ind_status && <StatusBadge code={p.ind_status} />}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isAtivo && p.ind_status && (
            <div className="flex gap-2 items-start p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>
                <strong>CAR com status "{STATUS_MAP[p.ind_status?.toUpperCase()]?.label ?? p.ind_status}".</strong>
                {p.des_condic && <> Motivo: {p.des_condic}.</>}
              </span>
            </div>
          )}

          <Section title="Identificação" icon={<MapPin className="w-4 h-4 text-blue-500" />}>
            <Row label="Nome / Denominação" value={property.nome || p.nom_tema} />
            <Row label="Código do Imóvel (CAR)" value={property.codImovel} />
            <Row label="Tipo de Imóvel" value={p.ind_tipo ? (TIPO_MAP[p.ind_tipo] ?? p.ind_tipo) : null} />
            <Row label="Município" value={property.municipio || p.municipio} />
            <Row label="Estado" value={p.cod_estado} />
            <Row label="Status" value={p.ind_status ? (STATUS_MAP[p.ind_status?.toUpperCase()]?.label ?? p.ind_status) : null} />
            <Row label="Condição" value={p.des_condic} />
            <Row label="Cadastrante" value={p.cadastrante} />
          </Section>

          <Section title="Áreas e Uso do Solo" icon={<BarChart3 className="w-4 h-4 text-emerald-500" />}>
            <Row label="Área total do imóvel" value={p.area_imovel ?? (p.num_area ? `${p.num_area} ha` : null)} />
            <Row label="Módulo fiscal" value={p.mod_fiscal != null ? `${p.mod_fiscal} módulo(s)` : null} />
            <Row label="Área remanescente (veg. nativa)" value={p.area_remanescente} />
            <Row label="Área de uso consolidado" value={p.area_uso_consolidado} />
            <Row label="Situação da Reserva Legal" value={p.situacao_reserva_legal} />
          </Section>

          <Section title="Datas e Histórico" icon={<Clock className="w-4 h-4 text-neutral-500" />}>
            <Row label="Data de criação/registro" value={p.dat_criaca || p.data_registro} />
            <Row label="Última atualização/retificação" value={p.dat_atuali || p.data_ultima_retificacao} />
          </Section>

          {p && Object.keys(p).length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-600 py-2 select-none list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Todos os campos ({Object.keys(p).length})
              </summary>
              <div className="mt-2 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="px-4 py-1">
                  {Object.entries(p).map(([key, val]) => (
                    <Row key={key} label={key} value={val != null ? String(val) : null} />
                  ))}
                </div>
              </div>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
