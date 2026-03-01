import { apiError, apiSuccess } from "@/lib/api/responses";
import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";

const previewPayloadSchema = z.object({
  regionId: z.number().int().positive("ID de região inválido."),
  newFeature: z.any() // Aceita objeto GeoJSON bruto
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    if (!json) {
      return apiError("Body JSON é obrigatório.", 400);
    }

    const parsed = previewPayloadSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("Payload inválido. Certifique-se de enviar regionId e newFeature.", 400);
    }

    const { regionId, newFeature } = parsed.data;

    // Extract the pure geometry because ST_GeomFromGeoJSON only supports Geometry objects
    let geometryToUse = newFeature;

    if (newFeature.type === "FeatureCollection" && newFeature.features?.length > 0) {
      // In this case, we'd ideally union all features in the collection, but for simplicity
      // and a typical shape upload, we'll try to extract geometries and union them in JS,
      // or just take the first one if it's a single feature. Let's build a GeometryCollection.
      geometryToUse = {
        type: "GeometryCollection",
        geometries: newFeature.features.map((f: any) => f.geometry).filter(Boolean)
      };
    } else if (newFeature.type === "Feature") {
      geometryToUse = newFeature.geometry;
    }

    if (!geometryToUse || !geometryToUse.type) {
        return apiError("Geometria não encontrada no payload enviado.", 400);
    }

    // Convert GeoJSON object back to string for PostGIS ingestion
    const geoJsonString = JSON.stringify(geometryToUse);

    // This query takes the geometry of the existing region from db,
    // unites it with the incoming GeoJSON feature, and returns a simplified version
    // ST_GeomFromGeoJSON creates a geometry from the string. We force SRID 4674 for consistency if needed,
    // but standard ST_GeomFromGeoJSON is enough if the incoming is proper WGS84/SIRGAS2000.
    const result = await db.execute(sql<{ ameba_preview: string }>`
      SELECT ST_AsGeoJSON(
        ST_Simplify(
          ST_Union(
            (SELECT geom FROM monitoramento.regioes WHERE id = ${regionId}),
            ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonString}), 4674)
          ),
          0.001
        )
      ) as ameba_preview;
    `);

    const amebaPreviewString = result.rows[0]?.ameba_preview;

    if (!amebaPreviewString) {
      return apiError("Falha ao gerar o preview da união geométrica.", 500);
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
    return apiError("Falha ao processar a união das regiões.", 500);
  }
}
