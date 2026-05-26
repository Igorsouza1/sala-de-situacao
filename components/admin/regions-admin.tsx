"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RegionGeometryEditor } from "@/components/admin/region-geometry-editor-dynamic";
import type { GeoJSONGeometry } from "@/components/admin/region-geometry-editor";

type Organization = { id: string; name: string };
type Region = {
  id: number;
  nome: string;
  descricao: string | null;
  organizationId: string | null;
  organizationName: string | null;
  sizeKm2: number;
};

const initialForm = {
  nome: "",
  descricao: "",
  organizationId: "",
  geometry: null as GeoJSONGeometry | null,
};

export function RegionsAdmin() {
  const [rows, setRows] = useState<Region[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    const [regionsRes, orgRes] = await Promise.all([
      fetch("/api/admin/regions", { cache: "no-store" }),
      fetch("/api/admin/organizations", { cache: "no-store" }),
    ]);
    const [regionsJson, orgJson] = await Promise.all([regionsRes.json(), orgRes.json()]);
    setRows(regionsJson.data ?? []);
    setOrganizations(orgJson.data ?? []);
  };

  useEffect(() => { loadData(); }, []);

  const onSubmit = async () => {
    setError(null);

    const payload = {
      nome: form.nome,
      descricao: form.descricao || null,
      organizationId: form.organizationId,
      geometry: form.geometry ?? undefined,
    };

    const url = editing ? `/api/admin/regions/${editing.id}` : "/api/admin/regions";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Erro ao salvar.");
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    await loadData();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Remover esta região? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/admin/regions/${id}`, { method: "DELETE" });
    await loadData();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setError(null);
    setOpen(true);
  };

  const openEdit = (row: Region) => {
    setEditing(row);
    setForm({
      nome: row.nome,
      descricao: row.descricao ?? "",
      organizationId: row.organizationId ?? "",
      geometry: null,
    });
    setError(null);
    setOpen(true);
  };

  const canSave =
    !!form.organizationId &&
    !!form.nome &&
    (editing ? true : !!form.geometry);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Regiões</h1>
        <Button onClick={openCreate}>Nova região</Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Região</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tenant / Organização</TableHead>
              <TableHead>Tamanho (km²)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.nome}</TableCell>
                <TableCell className="max-w-xs">
                  {row.descricao
                    ? <span className="text-sm text-neutral-600 line-clamp-1">{row.descricao}</span>
                    : <span className="text-neutral-400 text-xs italic">—</span>}
                </TableCell>
                <TableCell>
                  {row.organizationName ?? <span className="text-neutral-400 text-xs italic">Não vinculado</span>}
                </TableCell>
                <TableCell>{row.sizeKm2?.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)}>Editar</Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(row.id)}>Excluir</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar região" : "Nova região"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="space-y-1.5">
              <Label>Tenant / Organização</Label>
              <Select
                value={form.organizationId}
                onValueChange={(v) => setForm((p) => ({ ...p, organizationId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolher tenant" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nome da região</Label>
              <Input
                placeholder="Ex: Bacia do Rio da Prata"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Descrição{" "}
                <span className="text-xs text-neutral-400 font-normal">(opcional)</span>
              </Label>
              <Textarea
                placeholder="Breve descrição da área monitorada..."
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Geometria
                {editing && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    Deixe em branco para manter a geometria existente
                  </span>
                )}
              </Label>
              <RegionGeometryEditor
                value={form.geometry}
                onChange={(geom) => setForm((p) => ({ ...p, geometry: geom }))}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onSubmit} disabled={!canSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
