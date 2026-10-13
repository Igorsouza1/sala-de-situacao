import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { apiError } from "@/lib/api/responses";
import { getLayerCatalog } from "@/lib/repositories/layerRepository";

// A imagem empacotada de uma camada raster. Só quem enxerga a camada (a Organização dona, ou camada global) a recebe.
// O slug é único e a imagem nunca muda, então o navegador pode guardá-la por muito tempo.
export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response || !user || !tenantId) return response ?? apiError("Não autorizado.", 401);

  const { slug } = await context.params;
  const layer = await getLayerCatalog(slug, user.app_metadata?.is_superadmin === true ? undefined : tenantId);
  if (!layer || (layer.schemaConfig as { kind?: string } | null)?.kind !== "raster") return apiError("Camada não encontrada.", 404);

  const rows = (await db.execute<{ png: Buffer }>(sql`SELECT png FROM monitoramento.layer_rasters WHERE layer_id = ${layer.id}`)).rows;
  if (!rows[0]) return apiError("Imagem do raster não encontrada.", 404);

  return new NextResponse(new Uint8Array(rows[0].png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=86400, immutable" },
  });
}
