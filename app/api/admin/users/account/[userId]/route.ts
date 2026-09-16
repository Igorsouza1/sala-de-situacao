import { requireSuperadmin } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { deleteUserCompletely, UserManagementError } from "@/lib/service/userManagementService";
import { z } from "zod";

const userIdSchema = z.object({ userId: z.string().uuid("ID de usuário inválido.") });

/**
 * Exclusão completa de um usuário: remove todas as atribuições (todas as
 * organizações/regiões) e a conta de autenticação no Supabase, liberando o
 * email para um novo convite do zero.
 */
export async function DELETE(_: Request, context: { params: Promise<{ userId: string }> }) {
  try {
    const { response: authResponse } = await requireSuperadmin();
    if (authResponse) return authResponse;

    const params = await context.params;
    const idParsed = userIdSchema.safeParse(params);
    if (!idParsed.success) return apiError("ID de usuário inválido.", 400);

    const result = await deleteUserCompletely(idParsed.data.userId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof UserManagementError) {
      return apiError(error.message, error.status);
    }
    console.error("admin users full delete failed", error);
    return apiError("Falha ao excluir usuário.", 500);
  }
}
