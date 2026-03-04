import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { layerCatalogInMonitoramento, layerDataInMonitoramento } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const layerId = parseInt(params.id, 10);
    if (isNaN(layerId)) return apiError("ID da camada inválido.", 400);

    // Get region ID before deleting for revalidation
    const layer = await db.select({ regiaoId: layerCatalogInMonitoramento.regiaoId })
      .from(layerCatalogInMonitoramento)
      .where(eq(layerCatalogInMonitoramento.id, layerId))
      .limit(1)
      .then(res => res[0]);

    if (!layer) return apiError("Camada não encontrada.", 404);

    await db.transaction(async (tx) => {
      // Manual cascade delete
      await tx.delete(layerDataInMonitoramento).where(eq(layerDataInMonitoramento.layerId, layerId));
      await tx.delete(layerCatalogInMonitoramento).where(eq(layerCatalogInMonitoramento.id, layerId));
    });

    if (layer.regiaoId) {
       revalidateTag(`layerCatalog-${layer.regiaoId}`);
    }

    return apiSuccess({ message: "Camada excluída com sucesso." });
  } catch (error) {
    console.error("Failed to delete base layer", error);
    return apiError("Falha ao excluir camada.", 500);
  }
}
