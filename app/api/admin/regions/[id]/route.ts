import { apiError, apiSuccess } from "@/lib/api/responses";
import { deleteRegion, updateRegion } from "@/lib/service/adminService";
import { regionIdSchema, regionPayloadSchema } from "@/lib/validations/admin";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const idParsed = regionIdSchema.safeParse(params);
    if (!idParsed.success) {
      return apiError("ID inválido.", 400);
    }

    const json = await request.json().catch(() => null);
    if (!json) {
      return apiError("Body JSON é obrigatório.", 400);
    }

    const parsed = regionPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("Body inválido.", 400);
    }

    const updated = await updateRegion(idParsed.data.id, parsed.data);
    if (!updated) {
      return apiError("Região não encontrada.", 404);
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error("admin regions PUT failed", error);
    return apiError("Falha ao atualizar região.", 500);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const idParsed = regionIdSchema.safeParse(params);
    if (!idParsed.success) {
      return apiError("ID inválido.", 400);
    }

    const deleted = await deleteRegion(idParsed.data.id);
    if (!deleted) {
      return apiError("Região não encontrada.", 404);
    }

    return apiSuccess(deleted);
  } catch (error) {
    console.error("admin regions DELETE failed", error);
    return apiError("Falha ao remover região.", 500);
  }
}
