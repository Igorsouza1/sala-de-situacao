"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RegionGeometryEditor } from "@/components/admin/region-geometry-editor";

type Organization = { id: string; name: string };
type Region = {
  id: number;
  nome: string;
  organizationId: string | null;
  organizationName: string | null;
  sizeKm2: number;
};

const initialForm = { nome: "", organizationId: "", geometry: [] as [number, number][] };

export function RegionsAdmin() {
  const [rows, setRows] = useState<Region[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    const [regionsRes, orgRes] = await Promise.all([
      fetch("/api/admin/regions", { cache: "no-store" }),
      fetch("/api/admin/organizations", { cache: "no-store" }),
    ]);

    const [regionsJson, orgJson] = await Promise.all([regionsRes.json(), orgRes.json()]);
    setRows(regionsJson.data ?? []);
    setOrganizations(orgJson.data ?? []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async () => {
    const payload = {
      nome: form.nome,
      organizationId: form.organizationId,
      geometry: { type: "Polygon", coordinates: [form.geometry] },
    };

    const url = editing ? `/api/admin/regions/${editing.id}` : "/api/admin/regions";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    await loadData();
  };

  const onDelete = async (id: number) => {
    await fetch(`/api/admin/regions/${id}`, { method: "DELETE" });
    await loadData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Regiões</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setForm(initialForm);
            setOpen(true);
          }}
        >
          Nova região
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Região</TableHead>
              <TableHead>Organização Pertencente</TableHead>
              <TableHead>Tamanho (km²)</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.nome}</TableCell>
                <TableCell>{row.organizationName ?? "Não vinculado"}</TableCell>
                <TableCell>{row.sizeKm2?.toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(row);
                      setForm({ nome: row.nome, organizationId: row.organizationId ?? "", geometry: [] });
                      setOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(row.id)}>
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar região" : "Nova região"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <Select value={form.organizationId} onValueChange={(value) => setForm((prev) => ({ ...prev, organizationId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Escolher organização" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Nome (ex: Bacia do Rio da Prata)"
              value={form.nome}
              onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
            />

            <RegionGeometryEditor
              value={form.geometry}
              onChange={(coords) => setForm((prev) => ({ ...prev, geometry: coords }))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={!form.organizationId || !form.nome || form.geometry.length < 4}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
