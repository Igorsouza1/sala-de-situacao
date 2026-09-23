"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Pencil, Trash2, UserX } from "lucide-react";

type Organization = { id: string; name: string; slug: string | null };
type Region = { id: number; nome: string; organizationId: string | null };

type Role = "owner" | "editor" | "viewer" | "auditor";

type AccessRow = {
  roleId: number;
  userId: string;
  email: string | null;
  role: Role;
  tenantId: string;
  organizationName: string;
  regionId: number | null;
  regionName: string | null;
  createdAt: string;
  status: "pending" | "active";
};

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
  auditor: "Auditor",
};

const initialCreateForm = { email: "", tenantId: "", role: "viewer" as Role, regionIds: [] as number[], allRegions: false };

export function UsersAdmin({ initialOrgId }: { initialOrgId?: string }) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [orgFilter, setOrgFilter] = useState<string>(initialOrgId ?? "all");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit dialog
  const [editing, setEditing] = useState<AccessRow | null>(null);
  const [editForm, setEditForm] = useState<{ role: Role; regionId: string }>({ role: "viewer", regionId: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Delete user (full account wipe)
  const [deleteTarget, setDeleteTarget] = useState<AccessRow | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    const [orgsRes, regionsRes, usersRes] = await Promise.all([
      fetch("/api/admin/organizations", { cache: "no-store" }),
      fetch("/api/admin/regions", { cache: "no-store" }),
      fetch("/api/admin/users", { cache: "no-store" }),
    ]);
    const [orgsJson, regionsJson, usersJson] = await Promise.all([orgsRes.json(), regionsRes.json(), usersRes.json()]);
    setOrgs(orgsJson.data ?? []);
    setRegions(regionsJson.data ?? []);
    setRows(usersJson.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (initialOrgId) {
      setCreateForm((prev) => ({ ...prev, tenantId: initialOrgId }));
      setCreateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrgId]);

  const regionsForOrg = (orgId: string) => regions.filter((r) => r.organizationId === orgId);

  const filteredRows = useMemo(
    () => (orgFilter === "all" ? rows : rows.filter((r) => r.tenantId === orgFilter)),
    [rows, orgFilter],
  );

  const openCreate = () => {
    setCreateForm(initialCreateForm);
    setCreateError(null);
    setCreateSuccess(null);
    setCreateOpen(true);
  };

  const toggleRegion = (id: number) => {
    setCreateForm((prev) => ({
      ...prev,
      regionIds: prev.regionIds.includes(id) ? prev.regionIds.filter((r) => r !== id) : [...prev.regionIds, id],
    }));
  };

  const onCreateSubmit = async () => {
    setCreateError(null);
    setCreateSuccess(null);

    if (!createForm.email || !createForm.tenantId) {
      setCreateError("Email e organização são obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: createForm.email,
          tenantId: createForm.tenantId,
          role: createForm.role,
          regionIds: createForm.allRegions ? [] : createForm.regionIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error?.message ?? "Erro ao criar acesso.");
        return;
      }
      if (json.data.alreadyGranted) {
        setCreateSuccess("Esse usuário já tinha esse acesso — nada novo foi enviado.");
      } else if (json.data.mode === "invited") {
        setCreateSuccess("Convite enviado por email. O usuário só precisa clicar no link e definir a senha.");
      } else {
        setCreateSuccess("Usuário já existia — ele recebeu um email avisando do novo acesso.");
      }
      await loadAll();
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (row: AccessRow) => {
    setEditing(row);
    setEditForm({ role: row.role, regionId: row.regionId ? String(row.regionId) : "" });
    setEditError(null);
  };

  const onEditSubmit = async () => {
    if (!editing) return;
    setEditError(null);
    const res = await fetch(`/api/admin/users/${editing.roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editForm.role, regionId: editForm.regionId ? Number(editForm.regionId) : null }),
    });
    const json = await res.json();
    if (!res.ok) {
      setEditError(json.error?.message ?? "Erro ao atualizar.");
      return;
    }
    setEditing(null);
    await loadAll();
  };

  const onRevoke = async (row: AccessRow) => {
    if (!confirm(`Revogar acesso de ${row.email ?? row.userId} à região "${row.regionName ?? "toda a organização"}"?`)) return;
    await fetch(`/api/admin/users/${row.roleId}`, { method: "DELETE" });
    await loadAll();
  };

  const assignmentsForUser = (userId: string) => rows.filter((r) => r.userId === userId);

  const openDeleteUser = (row: AccessRow) => {
    setDeleteTarget(row);
    setDeleteError(null);
  };

  const onConfirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeletingUser(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/users/account/${deleteTarget.userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setDeleteError(json.error?.message ?? "Erro ao excluir usuário.");
        return;
      }
      setDeleteTarget(null);
      await loadAll();
    } finally {
      setDeletingUser(false);
    }
  };

  const onResend = async (row: AccessRow) => {
    setResendingId(row.roleId);
    setResendMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${row.roleId}/resend`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setResendMsg(json.error?.message ?? "Erro ao reenviar.");
        return;
      }
      setResendMsg(
        json.data.mode === "invited"
          ? `Convite reenviado para ${row.email}.`
          : `Aviso de acesso reenviado para ${row.email}.`,
      );
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Usuários das Regiões</h1>
        <div className="flex items-center gap-2">
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por organização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as organizações</SelectItem>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreate}>Novo usuário</Button>
        </div>
      </div>

      {resendMsg && <p className="text-sm text-blue-600">{resendMsg}</p>}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Organização</TableHead>
              <TableHead>Região</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-400 py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {filteredRows.map((row) => (
              <TableRow key={row.roleId}>
                <TableCell className="font-medium">{row.email ?? row.userId}</TableCell>
                <TableCell>{row.organizationName}</TableCell>
                <TableCell>
                  {row.regionName ?? <span className="text-neutral-400 text-xs italic">toda a organização</span>}
                </TableCell>
                <TableCell>{ROLE_LABELS[row.role] ?? row.role}</TableCell>
                <TableCell>
                  {row.status === "active" ? (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                      Convite pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2 whitespace-nowrap">
                  {row.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resendingId === row.roleId}
                      onClick={() => onResend(row)}
                      title="Reenviar convite"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(row)} title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onRevoke(row)} title="Revogar só este acesso (essa organização/região)">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteUser(row)}
                    title="Excluir usuário completamente (todas as organizações + conta de login)"
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>

          {createSuccess ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-green-600 font-medium">{createSuccess}</p>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Organização</Label>
                <Select
                  value={createForm.tenantId}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, tenantId: v, regionIds: [], allRegions: false }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar organização…" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Papel (Role)</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm((p) => ({ ...p, role: v as Role }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createForm.tenantId && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="all-regions"
                      checked={createForm.allRegions}
                      onCheckedChange={(checked) =>
                        setCreateForm((p) => ({ ...p, allRegions: checked === true, regionIds: [] }))
                      }
                    />
                    <Label htmlFor="all-regions" className="font-normal cursor-pointer">
                      Acesso a toda a organização (sem restringir região)
                    </Label>
                  </div>

                  {!createForm.allRegions && (
                    <div className="space-y-1.5">
                      <Label>Regiões</Label>
                      <div className="max-h-40 overflow-y-auto rounded-md border p-2 space-y-1.5">
                        {regionsForOrg(createForm.tenantId).length === 0 && (
                          <p className="text-xs text-neutral-400 italic">Essa organização não tem regiões cadastradas.</p>
                        )}
                        {regionsForOrg(createForm.tenantId).map((r) => (
                          <div key={r.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`region-${r.id}`}
                              checked={createForm.regionIds.includes(r.id)}
                              onCheckedChange={() => toggleRegion(r.id)}
                            />
                            <Label htmlFor={`region-${r.id}`} className="font-normal cursor-pointer">
                              {r.nome}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {createError && <p className="text-sm text-red-600">{createError}</p>}
            </div>
          )}

          {!createSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={onCreateSubmit} disabled={submitting || !createForm.email || !createForm.tenantId}>
                {submitting ? "Enviando…" : "Criar e enviar acesso"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar acesso — {editing?.email}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Papel (Role)</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v as Role }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Região</Label>
                <Select value={editForm.regionId || "none"} onValueChange={(v) => setEditForm((p) => ({ ...p, regionId: v === "none" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Toda a organização (sem região específica)</SelectItem>
                    {regionsForOrg(editing.tenantId).map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editError && <p className="text-sm text-red-600">{editError}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={onEditSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user completely */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário permanentemente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  Isso vai apagar <strong>{deleteTarget?.email ?? deleteTarget?.userId}</strong> por completo: a conta de
                  login no Supabase e{" "}
                  <strong>
                    {deleteTarget ? assignmentsForUser(deleteTarget.userId).length : 0} acesso(s)
                  </strong>{" "}
                  em todas as organizações e regiões dele, não só o desta linha.
                </p>
                <p>
                  Depois disso o email fica livre para um convite novo do zero. Essa ação não pode ser desfeita.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingUser}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirmDeleteUser();
              }}
              disabled={deletingUser}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingUser ? "Excluindo…" : "Excluir tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
