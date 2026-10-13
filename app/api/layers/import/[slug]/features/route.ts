export const maxDuration = 60;

import { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { layerDataInMonitoramento } from "@/db/schema";
import { requireRole } from "@/lib/api/require-auth";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { featureDate } from "@/lib/geo-import/geojson";
import { findImportedLayer } from "@/lib/geo-import/own-layer";

const MAX_PER_BATCH = 1000;

const bodySchema = z.object({
  features: z
    .array(
      z.object({
        geometry: z.object({ type: z.string() }).passthrough(),
        properties: z.record(z.string(), z.unknown()).nullish(),
      }),
    )
    .min(1)
    .max(MAX_PER_BATCH),
});

// Grava um lote de feições numa camada criada por /api/layers/import. A geometria entra como veio (sem simplificar):
// quem usa estes dados lê a área em hectares, e simplificar mudaria o número.
export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const auth = await requireRole("editor");
  if (auth.response) return auth.response;

  const { slug } = await context.params;
  const layer = await findImportedLayer(slug, auth.user!, auth.tenantId!);
  if (!layer) return apiError("Camada não encontrada.", 404);

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError("Lote de feições inválido.", 400);

  const fields = layer.schemaConfig as { dateField?: string; yearField?: string };
  const now = new Date();

  try {
    await db.insert(layerDataInMonitoramento).values(
      parsed.data.features.map((f) => ({
        layerId: layer.id,
        geom: sql`ST_Force2D(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(f.geometry)}), 4674)))`,
        properties: f.properties ?? {},
        dataRegistro: featureDate(f.properties, fields, now).toISOString(),
        tenantId: layer.tenantId,
      })),
    );
    return apiSuccess({ saved: parsed.data.features.length }, 201);
  } catch (error) {
    console.error("Erro ao gravar lote de feições importadas:", error);
    return apiError("Não foi possível gravar parte do arquivo.", 500);
  }
}
