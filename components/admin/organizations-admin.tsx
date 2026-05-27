"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  maxRegions: number;
  createdAt: string;
};

type Region = {
  id: number;
  nome: string;
  organizationId: string | null;
};

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const initialForm = { name: "", slug: "", maxRegions: 1 };
const initialInviteForm = { email: "", role: "viewer", regiaoId: "" };

export function OrganizationsAdmin() {
  const [rows, setRows] = useState<Organization[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  // Org form
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);
  const [form, setForm] = useState(initialForm);
  const [slugDirty, setSlugDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteOrg, setInviteOrg] = useState<Organization | null>(null);
  const [inviteForm, setInviteForm] = useState(initialInviteForm);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const loadRows = async () => {
    const res = await fetch("/api/admin/organizations", { cache: "no-store" });
    const json = await res.json();
    setRows(json.data ?? []);
  };

  const loadRegions = async () => {
    const res = await fetch("/api/admin/regions", { cache: "no-store" });
    const json = await res.json();
    setRegions(json.data ?? []);
  };

  useEffect(() => {
    loadRows();
    loadRegions();
  }, []);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugDirty ? prev.slug : toSlug(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setSlugDirty(true);
    setForm((prev) => ({ ...prev, slug: value }));
  };

  const onSubmit = async () => {
    setError(null);
    const url = editing ? `/api/admin/organizations/${editing.id}` : "/api/admin/organizations";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug: form.slug || null }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Erro ao salvar.");
      return;
    }

    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    setSlugDirty(false);
    await loadRows();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Remover este tenant? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/admin/organizations/${id}`, { method: "DELETE" });
    await loadRows();
  };

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setSlugDirty(false);
    setError(null);
    setOpen(true);
  };

  const openEdit = (org: Organization) => {
    setEditing(org);
    setForm({ name: org.name, slug: org.slug ?? "", maxRegions: org.maxRegions ?? 1 });
    setSlugDirty(true);
    setError(null);
    setOpen(true);
  };

  const openInvite = (org: Organization) => {
    setInviteOrg(org);
    setInviteForm(initialInviteForm);
    setInviteError(null);
    setInviteSuccess(false);
    setInviteOpen(true);
  };

  const onInvite = async () => {
    if (!inviteOrg) return;
    setInviteError(null);

    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteForm.email,
        tenantId: inviteOrg.id,
        regiaoId: inviteForm.regiaoId ? Number(inviteForm.regiaoId) : undefined,
        role: inviteForm.role,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setInviteError(json.error ?? "Erro ao enviar convite.");
      return;
    }

    setInviteSuccess(true);
  };

  const orgRegions = (orgId: string) => regions.filter((r) => r.organizationId === orgId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tenants / Organizações</h1>
        <Button onClick={openCreate}>Novo tenant</Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Limite de Regiões</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  {row.slug ? (
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{row.slug}</code>
                  ) : (
                    <span className="text-neutral-400 text-xs italic">sem slug</span>
                  )}
                </TableCell>
                <TableCell>{row.maxRegions ?? 1}</TableCell>
                <TableCell>{new Date(row.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openInvite(row)}>
                    Convidar
                  </Button>
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

      {/* Org create/edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar tenant" : "Novo tenant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Nome</Label>
              <Input
                id="org-name"
                placeholder="Ex: Instituto H2O"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-slug">
                Slug{" "}
                <span className="text-xs text-neutral-400 font-normal">
                  (identificador único para roteamento)
                </span>
              </Label>
              <Input
                id="org-slug"
                placeholder="ex: instituto-h2o"
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
              />
              <p className="text-xs text-neutral-500">
                Apenas letras minúsculas, números e hífens. Deixe vazio para não definir agora.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="org-max">Limite de regiões</Label>
              <Input
                id="org-max"
                type="number"
                min={1}
                value={form.maxRegions}
                onChange={(e) => setForm((prev) => ({ ...prev, maxRegions: Number(e.target.value || 1) }))}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit} disabled={!form.name}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite user dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário — {inviteOrg?.name}</DialogTitle>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-green-600 font-medium">Convite enviado com sucesso!</p>
              <p className="text-sm text-neutral-500">
                O usuário receberá um email com o link de ativação.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Papel (Role)</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(v) => setInviteForm((p) => ({ ...p, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {inviteOrg && orgRegions(inviteOrg.id).length > 0 && (
                <div className="space-y-1.5">
                  <Label>Região (opcional)</Label>
                  <Select
                    value={inviteForm.regiaoId}
                    onValueChange={(v) => setInviteForm((p) => ({ ...p, regiaoId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar região…" />
                    </SelectTrigger>
                    <SelectContent>
                      {orgRegions(inviteOrg.id).map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              {inviteSuccess ? "Fechar" : "Cancelar"}
            </Button>
            {!inviteSuccess && (
              <Button onClick={onInvite} disabled={!inviteForm.email}>
                Enviar convite
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
