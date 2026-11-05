import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { apiError } from "@/lib/api/responses";
import { getLayerCatalog } from "@/lib/repositories/layerRepository";

// O dado de uma camada raster: a imagem empacotada (fogo, valores) ou a série de anos codificada (classes, ex.: uso do solo).
// Só quem enxerga a camada (a Organização dona, ou camada global) o recebe.
// O slug é único e o dado nunca muda, então o navegador pode guardá-lo por muito tempo.
export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { user, tenantId, response } = await requireAuthWithTenant();
  if (response || !user || !tenantId) return response ?? apiError("Não autorizado.", 401);

  const { slug } = await context.params;
  const layer = await getLayerCatalog(slug, user.app_metadata?.is_superadmin === true ? undefined : tenantId);
  const sc = layer?.schemaConfig as { kind?: string; raster?: { mode?: string } } | null;
  if (!layer || sc?.kind !== "raster") return apiError("Camada não encontrada.", 404);

  const cache = "private, max-age=86400, immutable";
  if (sc.raster?.mode === "classes") {
    const rows = (await db.execute<{ data: Buffer }>(sql`SELECT data FROM monitoramento.layer_raster_series WHERE layer_id = ${layer.id}`)).rows;
    if (!rows[0]) return apiError("Série do raster não encontrada.", 404);
    return new NextResponse(new Uint8Array(rows[0].data), { headers: { "Content-Type": "application/octet-stream", "Cache-Control": cache } });
  }

  const rows = (await db.execute<{ png: Buffer }>(sql`SELECT png FROM monitoramento.layer_rasters WHERE layer_id = ${layer.id}`)).rows;
  if (!rows[0]) return apiError("Imagem do raster não encontrada.", 404);
  return new NextResponse(new Uint8Array(rows[0].png), { headers: { "Content-Type": "image/png", "Cache-Control": cache } });
}
