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
import { AlertCircle, Mail, Pencil, Trash2, UserX } from "lucide-react";

type Organization = { id: string; name: string; slug: string | null };
type Region = { id: number; nome: string; organizationId: string | null };

type Role = "owner" | "editor" | "viewer" | "auditor";

type AccessRow = {
  roleId: number | null;
  userId: string;
  email: string | null;
  role: Role | null;
  tenantId: string | null;
  organizationName: string | null;
  regionId: number | null;
  regionName: string | null;
  createdAt: string | null;
  status: "pending" | "active" | "no_access" | "no_region" | "superadmin";
  isSuperadmin: boolean;
};

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
  auditor: "Auditor",
};

const initialCreateForm = { email: "", tenantId: "", role: "viewer" as Role, regionIds: [] as number[] };

export function UsersAdmin({ initialOrgId }: { initialOrgId?: string }) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);
    try {
      const responses = await Promise.all([
        fetch("/api/admin/organizations", { cache: "no-store" }),
        fetch("/api/admin/regions", { cache: "no-store" }),
        fetch("/api/admin/users", { cache: "no-store" }),
      ]);
      if (responses.some((response) => !response.ok)) throw new Error("Falha ao carregar acessos.");
      const [orgsJson, regionsJson, usersJson] = await Promise.all(responses.map((response) => response.json()));
      setOrgs(orgsJson.data ?? []);
      setRegions(regionsJson.data ?? []);
      setRows(usersJson.data ?? []);
    } catch {
      setLoadError("Não foi possível carregar os usuários e seus acessos. Tente novamente.");
    } finally {
      setLoading(false);
    }
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
    () => orgFilter === "all" ? rows : orgFilter === "attention"
      ? rows.filter((row) => row.status === "no_access" || row.status === "no_region")
      : rows.filter((row) => row.tenantId === orgFilter),
    [rows, orgFilter],
  );
  const attentionCount = useMemo(() => new Set(rows
    .filter((row) => row.status === "no_access" || row.status === "no_region")
    .map((row) => row.userId)).size, [rows]);

  const openCreate = () => {
    setCreateForm(initialCreateForm);
    setCreateError(null);
    setCreateSuccess(null);
    setCreateOpen(true);
  };

  const openCreateForUser = (row: AccessRow) => {
    setCreateForm({ ...initialCreateForm, email: row.email ?? "", tenantId: initialOrgId ?? "" });
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
    if (createForm.role !== "owner" && createForm.regionIds.length === 0) {
      setCreateError("Selecione ao menos uma região para este papel.");
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
          regionIds: createForm.role === "owner" ? [] : createForm.regionIds,
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
    if (row.roleId === null || !row.role || !row.tenantId) return;
    setEditing(row);
    setEditForm({ role: row.role, regionId: row.role === "owner" ? "" : row.regionId ? String(row.regionId) : "" });
    setEditError(null);
  };

  const onEditSubmit = async () => {
    if (!editing || editing.roleId === null) return;
    setEditError(null);
    if (editForm.role !== "owner" && !editForm.regionId) {
      setEditError("Selecione uma região para este papel.");
      return;
    }
    const res = await fetch(`/api/admin/users/${editing.roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editForm.role, regionId: editForm.role === "owner" ? null : Number(editForm.regionId) }),
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
    if (row.roleId === null) return;
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
    if (row.roleId === null) return;
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
        <div>
          <h1 className="text-2xl font-semibold">Acessos dos usuários</h1>
          <p className="mt-1 text-sm text-neutral-600">Contas sem papel ou sem região aparecem em vermelho.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por organização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os usuários</SelectItem>
              <SelectItem value="attention">Precisam de acesso</SelectItem>
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
      {loadError && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
      {!loading && !loadError && attentionCount > 0 && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {attentionCount} {attentionCount === 1 ? "usuário precisa" : "usuários precisam"} de acesso ou região.
          </div>
          <Button variant="outline" size="sm" className="border-red-300 text-red-800" onClick={() => setOrgFilter("attention")}>Ver usuários</Button>
        </div>
      )}

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
            {!loading && !loadError && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-neutral-400 py-8">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
            {!loadError && filteredRows.map((row) => (
              <TableRow key={row.roleId ?? `no-access-${row.userId}`} className={row.status === "no_access" || row.status === "no_region" ? "bg-red-50/70" : undefined}>
                <TableCell className="font-medium">{row.email ?? row.userId}</TableCell>
                <TableCell>{row.organizationName ?? "—"}</TableCell>
                <TableCell>
                  {row.regionName ?? (row.role === "owner" || row.isSuperadmin
                    ? <span className="text-neutral-500 text-xs italic">toda a organização</span>
                    : <span className="text-red-700 text-xs font-medium">Sem região atribuída</span>)}
                </TableCell>
                <TableCell>{row.role ? ROLE_LABELS[row.role] ?? row.role : "—"}</TableCell>
                <TableCell>
                  {row.status === "no_access" ? (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Sem acesso</Badge>
                  ) : row.status === "no_region" ? (
                    <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Sem região</Badge>
                  ) : row.status === "superadmin" ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Superadmin</Badge>
                  ) : row.status === "active" ? (
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
                  {row.status === "no_access" && (
                    <Button variant="outline" size="sm" className="border-red-300 text-red-800" disabled={!row.email} onClick={() => openCreateForUser(row)}>
                      Conceder acesso
                    </Button>
                  )}
                  {row.roleId !== null && row.status === "pending" && (
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
                  {row.roleId !== null && !row.isSuperadmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => openEdit(row)} title="Editar acesso">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onRevoke(row)} title="Revogar só este acesso">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {!row.isSuperadmin && (
                    <Button variant="outline" size="sm" onClick={() => openDeleteUser(row)} title="Excluir usuário completamente">
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  )}
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
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, tenantId: v, regionIds: [] }))}
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
                <Select value={createForm.role} onValueChange={(v) => setCreateForm((p) => ({ ...p, role: v as Role, regionIds: v === "owner" ? [] : p.regionIds }))}>
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
                  {createForm.role === "owner" ? (
                    <p className="text-sm text-neutral-600">Owner acessa todas as regiões desta organização.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Regiões permitidas</Label>
                      <p className="text-xs text-neutral-500">Selecione ao menos uma região para o usuário conseguir acessar os dados.</p>
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
              <Button onClick={onCreateSubmit} disabled={submitting || !createForm.email || !createForm.tenantId || (createForm.role !== "owner" && createForm.regionIds.length === 0)}>
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
                <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v as Role, regionId: v === "owner" ? "" : p.regionId }))}>
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

              {editForm.role === "owner" ? (
                <p className="text-sm text-neutral-600">Owner acessa todas as regiões desta organização.</p>
              ) : (
                <div className="space-y-1.5">
                  <Label>Região permitida</Label>
                  <Select value={editForm.regionId} onValueChange={(v) => setEditForm((p) => ({ ...p, regionId: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionsForOrg(editing.tenantId ?? "").map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
