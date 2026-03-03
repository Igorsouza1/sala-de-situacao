import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const maxDuration = 60; // Allow more time for large geometry unions

export async function POST(request: Request) {
  try {
    const formData = await request.formData().catch((e) => {
      console.error("Erro ao fazer parse do FormData (possivelmente arquivo muito grande):", e);
      return null;
    });
    if (!formData) {
      return apiError("FormData inválido ou arquivo muito grande.", 400);
    }

    const regionIdStr = formData.get("regionId");
    const isForUnionStr = formData.get("isForUnion");

    // Suporta envio de single file pequeno ou envio de uploadId + totalChunks para arquivos pesados
    const file = formData.get("file") as File | null;
    const uploadId = formData.get("uploadId") as string | null;
    const totalChunksStr = formData.get("totalChunks") as string | null;

    if (!regionIdStr) {
      return apiError("regionId é obrigatório.", 400);
    }
    if (!file && (!uploadId || !totalChunksStr)) {
      return apiError("Arquivo ou uploadId são obrigatórios.", 400);
    }

    const regionId = parseInt(regionIdStr.toString(), 10);
    const isForUnion = isForUnionStr === "true";

    let fileContent = "";
    if (uploadId && totalChunksStr) {
      const totalChunks = parseInt(totalChunksStr, 10);
      try {
        const { assembleChunks } = await import("@/lib/chunk-upload");
        fileContent = assembleChunks(uploadId, totalChunks);
      } catch (e: any) {
        console.error("Assembly erro:", e);
        return apiError(e.message || "Erro ao unificar o arquivo GeoJSON.", 500);
      }
    } else if (file) {
      fileContent = await file.text();
    }

    // ATENÇÃO: Para arquivos muito grandes, JSON.parse seguido de features.map congela o V8 e trava o Next.js.
    // Vamos mandar o TEXTO PURO direto para o PostGIS analisar na C (muito mais rápido) usando jsonb.
    const geoJsonString = fileContent;

    const extractGeomsCTE = sql`
      WITH payload AS (
        SELECT ${geoJsonString}::jsonb AS doc
      ),
      extracted_geoms AS (
        SELECT 
          CASE 
            WHEN doc->>'type' = 'FeatureCollection' THEN 
              (SELECT ST_Collect(ST_Simplify(ST_MakeValid(ST_GeomFromGeoJSON(f->'geometry')), 0.02)) FROM jsonb_array_elements(doc->'features') AS f WHERE f->>'geometry' IS NOT NULL)
            WHEN doc->>'type' = 'Feature' THEN 
              ST_Simplify(ST_MakeValid(ST_GeomFromGeoJSON(doc->'geometry')), 0.02)
            ELSE 
              ST_Simplify(ST_MakeValid(ST_GeomFromGeoJSON(doc)), 0.02)
          END as geom
        FROM payload
      )
    `;

    let amebaPreviewString: string;

    if (isForUnion) {
      // Faz apenas um Collect rápido para não estourar tempo com processamentos topológicos de Union no preview
      // O Leaflet aceita tranquilamente desenhos sobrepostos numa GeometryCollection
      const result = await db.execute(sql<{ ameba_preview: string }>`
        ${extractGeomsCTE}
        SELECT ST_AsGeoJSON(
          ST_Collect(
            ST_Simplify((SELECT geom FROM monitoramento.regioes WHERE id = ${regionId}), 0.02),
            ST_SetSRID((SELECT geom FROM extracted_geoms), 4674)
          )
        ) as ameba_preview;
      `);
      amebaPreviewString = result.rows[0]?.ameba_preview as string;
    } else {
      // Apenas simplifica o próprio shape para o preview no mapa, minimizado agressivamente p/ navegação leve
      const result = await db.execute(sql<{ ameba_preview: string }>`
        ${extractGeomsCTE}
        SELECT ST_AsGeoJSON(
          ST_SetSRID((SELECT geom FROM extracted_geoms), 4674)
        ) as ameba_preview;
      `);
      amebaPreviewString = result.rows[0]?.ameba_preview as string;
    }

    if (!amebaPreviewString) {
      return apiError("Falha ao gerar o preview da geometria.", 500);
    }

    const amebaGeoJson = JSON.parse(amebaPreviewString);

    return apiSuccess({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: amebaGeoJson,
          properties: {}
        }
      ]
    });

  } catch (error) {
    console.error("admin regions preview-union POST failed", error);
    return apiError("Falha ao processar a geometria enviada. Arquivo pode ser muito grande ou mal formatado.", 500);
  }
}
