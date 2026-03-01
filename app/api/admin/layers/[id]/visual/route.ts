import { apiError, apiSuccess } from "@/lib/api/responses";
import { z } from "zod";
import { db } from "@/db";
import { layerCatalogInMonitoramento, layerDataInMonitoramento } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

const visualPayloadSchema = z.object({
  name: z.string().min(1, "Nome não pode ser vazio."),
  visualConfig: z.any()
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const layerId = parseInt(params.id, 10);
    if (isNaN(layerId)) return apiError("ID da camada inválido.", 400);

    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON é obrigatório.", 400);

    const parsed = visualPayloadSchema.safeParse(json);
    if (!parsed.success) return apiError("Payload inválido.", 400);

    const { name, visualConfig } = parsed.data;

    const [updated] = await db.update(layerCatalogInMonitoramento)
      .set({
        name,
        visualConfig
      })
      .where(eq(layerCatalogInMonitoramento.id, layerId))
      .returning({ regiaoId: layerCatalogInMonitoramento.regiaoId });

    if (!updated) {
      return apiError("Camada não encontrada.", 404);
    }

    if (updated.regiaoId) {
       revalidateTag(`layerCatalog-${updated.regiaoId}`);
    }

    return apiSuccess({ message: "Camada atualizada com sucesso." });
  } catch (error) {
    console.error("Failed to update base layer visual config", error);
    return apiError("Falha ao atualizar configurações visuais.", 500);
  }
}
