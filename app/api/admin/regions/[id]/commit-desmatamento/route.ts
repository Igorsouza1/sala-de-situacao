import { parsePositiveId } from "@/lib/api/positive-id";
export const maxDuration = 60;

import { getTenantIdForRegion } from "@/lib/api/scope";
import { requireRole } from "@/lib/api/require-auth";
import { apiError } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { response: authResponse } = await requireRole("superadmin");
    if (authResponse) return authResponse;

    const params = await context.params;
    const regionId = parsePositiveId(params.id);
    if (regionId === null) return apiError("ID da região inválido.", 400);

    const formData = await request.formData().catch(() => null);
    if (!formData) return apiError("FormData é obrigatório.", 400);

    const file = formData.get("file") as File;
    if (!file) return apiError("Arquivo é obrigatório.", 400);

    const fileContent = await file.text();
    const parsedGeoJson = JSON.parse(fileContent);

    let features: any[] = [];
    if (parsedGeoJson.type === "FeatureCollection") {
      features = parsedGeoJson.features;
    } else if (parsedGeoJson.type === "Feature") {
      features = [parsedGeoJson];
    } else {
      return apiError("Formato GeoJSON inválido. Esperado FeatureCollection ou Feature.", 400);
    }

    const tenantId = await getTenantIdForRegion(regionId);
    if (!tenantId) return apiError(`Região ${regionId} não possui Organização associada.`, 400);

    const seenInFile = new Set<string>();

    let insertedCount = 0;
    let skippedCount = 0;

    for (const feature of features) {
      const props = feature.properties || {};
      const geometry = feature.geometry;

      const alertid = String(props.ALERTID ?? props.alertid ?? "").trim();
      if (!geometry || !alertid || seenInFile.has(alertid)) {
        skippedCount++;
        continue;
      }
      seenInFile.add(alertid);

      const alertcode: string | null = String(props.ALERTCODE ?? props.alertcode ?? "") || null;
      const rawAlertHA = props.ALERTHA ?? props.alertha;
      const alertha: number | null = rawAlertHA != null ? parseFloat(rawAlertHA) : null;
      const source: string | null = props.SOURCE ?? props.source ?? null;
      const detectat: string | null = props.DETECTAT ?? props.detectat ?? null;
      const rawDetectYear = props.DETECTYEAR ?? props.detectyear;
      const detectyear: number | null = rawDetectYear != null ? parseInt(rawDetectYear, 10) : null;
      const state: string | null = props.STATE ?? props.state ?? null;
      const rawStateHA = props.STATEHA ?? props.stateha;
      const stateha: number | null = rawStateHA != null ? parseFloat(rawStateHA) : null;

      const geomJson = JSON.stringify(geometry);

      // O fato físico é universal. A associação, inclusive o estado da
      // notificação histórica, pertence à região. Um único comando mantém
      // o upsert e o vínculo atômicos mesmo em importações concorrentes.
      const result = await db.execute<{ linked: boolean }>(sql`
        WITH fact AS (
          INSERT INTO monitoramento.desmatamento
            (alertid, alertcode, alertha, source, detectat, detectyear,
             state, stateha, geom)
          VALUES
            (${alertid}, ${alertcode},
             ${isNaN(alertha as number) ? null : alertha},
             ${source}, ${detectat},
             ${isNaN(detectyear as number) ? null : detectyear},
             ${state},
             ${isNaN(stateha as number) ? null : stateha},
             ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4674))
          ON CONFLICT (alertid) WHERE alertid IS NOT NULL
          DO UPDATE SET alertid = EXCLUDED.alertid
          RETURNING id
        ), link AS (
          INSERT INTO monitoramento.desmatamento_regioes
            (desmatamento_id, regiao_id, alerta_enviado)
          SELECT id, ${regionId}, true FROM fact
          ON CONFLICT (desmatamento_id, regiao_id) DO NOTHING
          RETURNING id
        )
        SELECT EXISTS(SELECT 1 FROM link) AS linked
      `);
      if (result.rows[0]?.linked) insertedCount++;
      else skippedCount++;
    }

    return Response.json({ success: true, data: { inserted: insertedCount, skipped: skippedCount } });
  } catch (error) {
    console.error("Failed to commit desmatamento", error);
    return apiError("Falha ao salvar os dados de desmatamento.", 500);
  }
}
