import { apiError, apiSuccess } from "@/lib/api/responses";
import { createOrganization, listOrganizations } from "@/lib/service/adminService";
import { organizationPayloadSchema } from "@/lib/validations/admin";

export async function GET() {
  try {
    const data = await listOrganizations();
    return apiSuccess(data);
  } catch (error) {
    console.error("admin organizations GET failed", error);
    return apiError("Falha ao listar organizações.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    if (!json) {
      return apiError("Body JSON é obrigatório.", 400);
    }

    const parsed = organizationPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("Body inválido.", 400);
    }

    const created = await createOrganization(parsed.data);
    return apiSuccess(created, 201);
  } catch (error) {
    console.error("admin organizations POST failed", error);
    return apiError("Falha ao criar organização.", 500);
  }
}
