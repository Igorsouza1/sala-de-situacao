import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { propriedadesInMonitoramento } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const propertyId = parseInt(params.id, 10);

    if (isNaN(propertyId)) {
      return apiError("ID de propriedade inválido.", 400);
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return apiError("Body inválido.", 400);
    }

    const { nome, properties } = body;

    const [updated] = await db
      .update(propriedadesInMonitoramento)
      .set({
        nome: nome,
        properties: properties, // Directly updating the JSONB field
      })
      .where(eq(propriedadesInMonitoramento.id, propertyId))
      .returning({ id: propriedadesInMonitoramento.id, regiaoId: propriedadesInMonitoramento.regiaoId });

    if (!updated) {
      return apiError("Propriedade não encontrada.", 404);
    }

    revalidateTag(`properties-${updated.regiaoId}`);

    return apiSuccess({ id: updated.id });
  } catch (error) {
    console.error("Failed to update property:", error);
    return apiError("Erro ao atualizar propriedade.", 500);
  }
}
