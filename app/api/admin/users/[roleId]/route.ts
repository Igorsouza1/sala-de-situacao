import { requireSuperadmin } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { updateUserAccessSchema } from "@/lib/validations/userManagement";
import { revokeUserAccess, updateUserAccess, UserManagementError } from "@/lib/service/userManagementService";
import { z } from "zod";

const roleIdSchema = z.object({ roleId: z.coerce.number().int().positive("ID inválido.") });

export async function PATCH(request: Request, context: { params: Promise<{ roleId: string }> }) {
  try {
    const { response: authResponse } = await requireSuperadmin();
    if (authResponse) return authResponse;

    const params = await context.params;
    const idParsed = roleIdSchema.safeParse(params);
    if (!idParsed.success) return apiError("ID inválido.", 400);

    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON é obrigatório.", 400);

    const parsed = updateUserAccessSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Body inválido.", 400);
    }

    const updated = await updateUserAccess(idParsed.data.roleId, parsed.data);
    return apiSuccess(updated);
  } catch (error) {
    if (error instanceof UserManagementError) {
      return apiError(error.message, error.status);
    }
    console.error("admin users PATCH failed", error);
    return apiError("Falha ao atualizar acesso.", 500);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ roleId: string }> }) {
  try {
    const { response: authResponse } = await requireSuperadmin();
    if (authResponse) return authResponse;

    const params = await context.params;
    const idParsed = roleIdSchema.safeParse(params);
    if (!idParsed.success) return apiError("ID inválido.", 400);

    const deleted = await revokeUserAccess(idParsed.data.roleId);
    return apiSuccess(deleted);
  } catch (error) {
    if (error instanceof UserManagementError) {
      return apiError(error.message, error.status);
    }
    console.error("admin users DELETE failed", error);
    return apiError("Falha ao revogar acesso.", 500);
  }
}
