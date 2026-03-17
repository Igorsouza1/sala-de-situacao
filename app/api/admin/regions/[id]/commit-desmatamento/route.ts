import { apiError } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { desmatamentoInMonitoramento } from "@/db/schema";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) return apiError("ID da região inválido.", 400);

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

    // Coletar todos os alertids presentes no arquivo
    const alertidsNoArquivo = features
      .map((f) => {
        const p = f.properties || {};
        const id = p.ALERTID ?? p.alertid;
        return id != null ? String(id) : undefined;
      })
      .filter((id): id is string => !!id);

    // Buscar quais alertids já existem para essa região
    const existingAlertids = new Set<string>();
    if (alertidsNoArquivo.length > 0) {
      const existingResult = await db.execute(sql`
        SELECT alertid FROM monitoramento.desmatamento
        WHERE regiao_id = ${regionId}
          AND alertid = ANY(ARRAY[${sql.raw(alertidsNoArquivo.map((id) => `'${id.replace(/'/g, "''")}'`).join(","))}]::text[])
      `);
      for (const row of existingResult.rows as any[]) {
        if (row.alertid) existingAlertids.add(row.alertid);
      }
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const feature of features) {
      const props = feature.properties || {};
      const geometry = feature.geometry;

      if (!geometry) {
        skippedCount++;
        continue;
      }

      const alertid: string | null = String(props.ALERTID ?? props.alertid ?? "") || null;

      // Deduplicação por alertid quando disponível
      if (alertid && existingAlertids.has(alertid)) {
        skippedCount++;
        continue;
      }

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

      await db.insert(desmatamentoInMonitoramento).values({
        alertid,
        alertcode,
        alertha: isNaN(alertha as number) ? null : alertha,
        source,
        detectat,
        detectyear: isNaN(detectyear as number) ? null : detectyear,
        state,
        stateha: isNaN(stateha as number) ? null : stateha,
        geom: sql`ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4674)`,
        regiaoId: regionId,
      });

      if (alertid) existingAlertids.add(alertid);
      insertedCount++;
    }

    return Response.json({ success: true, data: { inserted: insertedCount, skipped: skippedCount } });
  } catch (error) {
    console.error("Failed to commit desmatamento", error);
    return apiError("Falha ao salvar os dados de desmatamento.", 500);
  }
}
