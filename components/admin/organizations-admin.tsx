"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Organization = {
  id: string;
  name: string;
  maxRegions: number;
  createdAt: string;
};

const initialForm = { name: "", maxRegions: 1 };

export function OrganizationsAdmin() {
  const [rows, setRows] = useState<Organization[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState(initialForm);

  const loadRows = async () => {
    const res = await fetch("/api/admin/organizations", { cache: "no-store" });
    const json = await res.json();
    setRows(json.data ?? []);
  };

  useEffect(() => {
    loadRows();
  }, []);

  const onSubmit = async () => {
    const url = editing ? `/api/admin/organizations/${editing.id}` : "/api/admin/organizations";
    const method = editing ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    await loadRows();
  };

  const onDelete = async (id: string) => {
    await fetch(`/api/admin/organizations/${id}`, { method: "DELETE" });
    await loadRows();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setOpen(true);
  };

  const openEdit = (org: Organization) => {
    setEditing(org);
    setForm({ name: org.name, maxRegions: org.maxRegions ?? 1 });
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizações</h1>
        <Button onClick={openCreate}>Nova organização</Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Organização</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead>Limite de Regiões</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{row.maxRegions ?? 1}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
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
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar organização" : "Nova organização"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Nome (ex: IHP)"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              type="number"
              min={1}
              placeholder="Limite de Regiões"
              value={form.maxRegions}
              onChange={(event) => setForm((prev) => ({ ...prev, maxRegions: Number(event.target.value || 1) }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
