import { requireSuperadmin } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { resendUserInvite, UserManagementError } from "@/lib/service/userManagementService";
import { z } from "zod";

const roleIdSchema = z.object({ roleId: z.coerce.number().int().positive("ID inválido.") });

export async function POST(_: Request, context: { params: Promise<{ roleId: string }> }) {
  try {
    const { response: authResponse } = await requireSuperadmin();
    if (authResponse) return authResponse;

    const params = await context.params;
    const idParsed = roleIdSchema.safeParse(params);
    if (!idParsed.success) return apiError("ID inválido.", 400);

    const result = await resendUserInvite(idParsed.data.roleId);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof UserManagementError) {
      return apiError(error.message, error.status);
    }
    console.error("admin users resend failed", error);
    return apiError("Falha ao reenviar convite.", 500);
  }
}
