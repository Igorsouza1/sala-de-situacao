import { apiError, apiSuccess } from "@/lib/api/responses";
import { deleteOrganization, updateOrganization } from "@/lib/service/adminService";
import { organizationIdSchema, organizationPayloadSchema } from "@/lib/validations/admin";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const idParsed = organizationIdSchema.safeParse(params);
    if (!idParsed.success) {
      return apiError("ID inválido.", 400);
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return apiError("Body JSON é obrigatório.", 400);
    }

    const parsed = organizationPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("Body inválido.", 400);
    }

    const updated = await updateOrganization(idParsed.data.id, parsed.data);
    if (!updated) {
      return apiError("Organização não encontrada.", 404);
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error("admin organizations PUT failed", error);
    return apiError("Falha ao atualizar organização.", 500);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const idParsed = organizationIdSchema.safeParse(params);
    if (!idParsed.success) {
      return apiError("ID inválido.", 400);
    }

    const deleted = await deleteOrganization(idParsed.data.id);
    if (!deleted) {
      return apiError("Organização não encontrada.", 404);
    }

    return apiSuccess(deleted);
  } catch (error) {
    console.error("admin organizations DELETE failed", error);
    return apiError("Falha ao remover organização.", 500);
  }
}
