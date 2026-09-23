import { createAdminClient } from "@/lib/supabase/admin";
import { buildAccessGrantedEmail, buildInviteEmail, sendEmail } from "@/lib/email/resend";
import type { CreateUserAccessPayload, UpdateUserAccessPayload } from "@/lib/validations/userManagement";
import {
  deleteAllLegacyUserAccessInDb,
  deleteAllRoleAssignmentsForUserInDb,
  deleteRoleAssignmentInDb,
  ensureLegacyUserAccessInDb,
  findAuthUserByEmailInDb,
  getRegionNamesInDb,
  getRoleAssignmentByIdInDb,
  getTenantNameInDb,
  insertRoleAssignmentsInDb,
  listUserAccessInDb,
  regionsBelongToTenantInDb,
  tenantExistsInDb,
  updateRoleAssignmentInDb,
  type UserAccessRow,
} from "@/lib/repositories/userManagementRepository";

export type AccessStatus = "pending" | "active";

export interface UserAccessListItem extends UserAccessRow {
  status: AccessStatus;
}

function statusOf(row: UserAccessRow): AccessStatus {
  return row.emailConfirmedAt ? "active" : "pending";
}

export async function listUserAccess(): Promise<UserAccessListItem[]> {
  const rows = await listUserAccessInDb();
  return rows.map((row) => ({ ...row, status: statusOf(row) }));
}

function inviteRedirectUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_BASE_URL não configurado.");
  return `${base.replace(/\/$/, "")}/invite`;
}

function signInUrl(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_BASE_URL não configurado.");
  return `${base.replace(/\/$/, "")}/sign-in`;
}

export class UserManagementError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

export interface CreateUserAccessResult {
  userId: string;
  email: string;
  createdAssignments: number;
  alreadyGranted: boolean;
  mode: "invited" | "notified";
}

export async function createUserAccess(payload: CreateUserAccessPayload): Promise<CreateUserAccessResult> {
  const { email, tenantId, role, regionIds } = payload;

  if (!(await tenantExistsInDb(tenantId))) {
    throw new UserManagementError("Organização não encontrada.", 404);
  }

  if (!(await regionsBelongToTenantInDb(tenantId, regionIds))) {
    throw new UserManagementError("Uma ou mais regiões não pertencem a essa organização.", 400);
  }

  const supabaseAdmin = createAdminClient();
  const existing = await findAuthUserByEmailInDb(email);

  let userId: string;
  let mode: "invited" | "notified";
  let actionLink: string | null = null;

  if (!existing) {
    // Usuário novo: cria a conta e gera o link de convite.
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo: inviteRedirectUrl() },
    });
    if (error) {
      throw new UserManagementError(error.message, 500);
    }
    userId = data.user.id;
    actionLink = data.properties.action_link;
    mode = "invited";

    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { tenant_id: tenantId },
    });
    if (metaError) {
      throw new UserManagementError(`Convite gerado mas falhou ao associar organização: ${metaError.message}`, 500);
    }
  } else if (!existing.emailConfirmedAt) {
    // Já existe mas nunca ativou a conta: gera um link novo (recovery serve
    // igual, a página /invite só precisa de uma sessão válida).
    userId = existing.id;
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: inviteRedirectUrl() },
    });
    if (error) {
      throw new UserManagementError(error.message, 500);
    }
    actionLink = data.properties.action_link;
    mode = "invited";
  } else {
    // Já existe e já ativou a conta: só notifica o novo acesso.
    userId = existing.id;
    mode = "notified";
  }

  const insertedRows = await insertRoleAssignmentsInDb({ tenantId, userId, role, regionIds });

  if (insertedRows.length === 0) {
    return { userId, email, createdAssignments: 0, alreadyGranted: true, mode };
  }

  const firstRegionId = insertedRows.find((r) => r.regionId != null)?.regionId ?? null;
  await ensureLegacyUserAccessInDb({ userId, tenantId, regionId: firstRegionId });

  const [organizationName, regionNames] = await Promise.all([
    getTenantNameInDb(tenantId),
    getRegionNamesInDb(insertedRows.map((r) => r.regionId).filter((id): id is number => id != null)),
  ]);

  const emailContent = mode === "invited"
    ? buildInviteEmail({
        organizationName: organizationName ?? "Prisma",
        role,
        regionNames,
        actionLink: actionLink!,
      })
    : buildAccessGrantedEmail({
        organizationName: organizationName ?? "Prisma",
        role,
        regionNames,
        signInLink: signInUrl(),
      });

  await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });

  return { userId, email, createdAssignments: insertedRows.length, alreadyGranted: false, mode };
}

export interface ResendInviteResult {
  mode: "invited" | "notified";
}

export async function resendUserInvite(roleId: number): Promise<ResendInviteResult> {
  const row = await getRoleAssignmentByIdInDb(roleId);
  if (!row || !row.email) {
    throw new UserManagementError("Atribuição não encontrada.", 404);
  }

  const supabaseAdmin = createAdminClient();
  const regionNames = row.regionName ? [row.regionName] : [];

  if (!row.emailConfirmedAt) {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: row.email,
      options: { redirectTo: inviteRedirectUrl() },
    });
    if (error) throw new UserManagementError(error.message, 500);

    const emailContent = buildInviteEmail({
      organizationName: row.organizationName,
      role: row.role,
      regionNames,
      actionLink: data.properties.action_link,
    });
    await sendEmail({ to: row.email, subject: emailContent.subject, html: emailContent.html });
    return { mode: "invited" };
  }

  const emailContent = buildAccessGrantedEmail({
    organizationName: row.organizationName,
    role: row.role,
    regionNames,
    signInLink: signInUrl(),
  });
  await sendEmail({ to: row.email, subject: emailContent.subject, html: emailContent.html });
  return { mode: "notified" };
}

export async function updateUserAccess(roleId: number, payload: UpdateUserAccessPayload) {
  const row = await getRoleAssignmentByIdInDb(roleId);
  if (!row) throw new UserManagementError("Atribuição não encontrada.", 404);

  if (payload.regionId != null && !(await regionsBelongToTenantInDb(row.tenantId, [payload.regionId]))) {
    throw new UserManagementError("Região não pertence a essa organização.", 400);
  }

  const updated = await updateRoleAssignmentInDb(roleId, payload);
  if (!updated) throw new UserManagementError("Atribuição não encontrada.", 404);
  return updated;
}

export async function revokeUserAccess(roleId: number) {
  const deleted = await deleteRoleAssignmentInDb(roleId);
  if (!deleted) throw new UserManagementError("Atribuição não encontrada.", 404);
  return deleted;
}

export interface DeleteUserResult {
  removedAssignments: number;
}

/**
 * Exclusão completa: remove todas as atribuições (todas as orgs/regiões) e a
 * própria conta de autenticação no Supabase, liberando o email para um novo
 * convite do zero. Usado principalmente para reteste (mesmo email).
 */
export async function deleteUserCompletely(userId: string): Promise<DeleteUserResult> {
  const removedAssignments = await deleteAllRoleAssignmentsForUserInDb(userId);
  await deleteAllLegacyUserAccessInDb(userId);

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    throw new UserManagementError(
      `Acessos removidos, mas falhou ao excluir a conta de login: ${error.message}. Tente excluir de novo.`,
      500,
    );
  }

  return { removedAssignments };
}
