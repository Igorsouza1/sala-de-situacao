import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return apiError("FormData é obrigatório.", 400);
    }

    const regionIdStr = formData.get("regionId");
    const isForUnionStr = formData.get("isForUnion");
    const file = formData.get("file") as File;

    if (!regionIdStr || !file) {
      return apiError("regionId e file são obrigatórios.", 400);
    }

    const regionId = parseInt(regionIdStr.toString(), 10);
    const isForUnion = isForUnionStr === "true";

    // Lendo o arquivo pesado direto no servidor
    const fileContent = await file.text();
    const newFeature = JSON.parse(fileContent);

    // Extract the pure geometry because ST_GeomFromGeoJSON only supports Geometry objects
    let geometryToUse = newFeature;

    if (newFeature.type === "FeatureCollection" && newFeature.features?.length > 0) {
      geometryToUse = {
        type: "GeometryCollection",
        geometries: newFeature.features.map((f: any) => f.geometry).filter(Boolean)
      };
    } else if (newFeature.type === "Feature") {
      geometryToUse = newFeature.geometry;
    }

    if (!geometryToUse || !geometryToUse.type) {
        return apiError("Geometria não encontrada no arquivo.", 400);
    }

    // Convert GeoJSON object back to string for PostGIS ingestion
    const geoJsonString = JSON.stringify(geometryToUse);

    let amebaPreviewString: string;

    if (isForUnion) {
      // Faz o Union pesado
      const result = await db.execute(sql<{ ameba_preview: string }>`
        SELECT ST_AsGeoJSON(
          ST_Simplify(
            ST_Union(
              (SELECT geom FROM monitoramento.regioes WHERE id = ${regionId}),
              ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonString}), 4674)
            ),
            0.005
          )
        ) as ameba_preview;
      `);
      amebaPreviewString = result.rows[0]?.ameba_preview;
    } else {
      // Apenas simplifica o próprio shape para o preview no mapa
      const result = await db.execute(sql<{ ameba_preview: string }>`
        SELECT ST_AsGeoJSON(
          ST_Simplify(
            ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonString}), 4674),
            0.005
          )
        ) as ameba_preview;
      `);
      amebaPreviewString = result.rows[0]?.ameba_preview;
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
