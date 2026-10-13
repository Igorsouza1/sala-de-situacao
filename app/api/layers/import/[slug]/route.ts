import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { layerCatalogInMonitoramento, layerDataInMonitoramento } from "@/db/schema";
import { requireRole } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { findImportedLayer } from "@/lib/geo-import/own-layer";

// Desfaz uma importação que não terminou: apaga a camada e as feições que já tinham entrado.
// Só alcança camadas criadas pela importação por arrastar e soltar.
export async function DELETE(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const auth = await requireRole("editor");
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const layer = await findImportedLayer(slug, auth.user!, auth.tenantId!);
  if (!layer) return apiError("Camada não encontrada.", 404);

  try {
    await db.transaction(async (tx) => {
      await tx.delete(layerDataInMonitoramento).where(eq(layerDataInMonitoramento.layerId, layer.id));
      await tx.delete(layerCatalogInMonitoramento).where(eq(layerCatalogInMonitoramento.id, layer.id));
    });
    if (layer.regiaoId) revalidateTag(`layerCatalog-${layer.regiaoId}`, { expire: 0 });
    return apiSuccess({ removed: true });
  } catch (error) {
    console.error("Erro ao desfazer importação:", error);
    return apiError("Não foi possível desfazer a importação.", 500);
  }
}
