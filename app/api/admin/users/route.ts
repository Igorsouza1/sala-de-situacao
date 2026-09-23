import { requireSuperadmin } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { createUserAccessSchema } from "@/lib/validations/userManagement";
import { createUserAccess, listUserAccess, UserManagementError } from "@/lib/service/userManagementService";

export async function GET() {
  try {
    const { response: authResponse } = await requireSuperadmin();
    if (authResponse) return authResponse;

    const data = await listUserAccess();
    return apiSuccess(data);
  } catch (error) {
    console.error("admin users GET failed", error);
    return apiError("Falha ao listar usuários.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const { response: authResponse } = await requireSuperadmin();
    if (authResponse) return authResponse;

    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON é obrigatório.", 400);

    const parsed = createUserAccessSchema.safeParse(json);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Body inválido.", 400);
    }

    const result = await createUserAccess(parsed.data);
    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof UserManagementError) {
      return apiError(error.message, error.status);
    }
    console.error("admin users POST failed", error);
    return apiError("Falha ao criar acesso do usuário.", 500);
  }
}
