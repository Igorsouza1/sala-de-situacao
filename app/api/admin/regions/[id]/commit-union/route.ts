import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) return apiError("ID da região inválido.", 400);

    const formData = await request.formData().catch(() => null);
    if (!formData) return apiError("FormData é obrigatório.", 400);

    const expandBoundaryStr = formData.get("expandBoundary");
    const expandBoundary = expandBoundaryStr === "true";
    const file = formData.get("file") as File;

    if (!file || expandBoundaryStr !== "true") {
      return apiError("Arquivo inválido ou confirmação ausente.", 400);
    }

    const fileContent = await file.text();
    const newFeature = JSON.parse(fileContent);

    let geometryToUseForUnion = newFeature;
    if (newFeature.type === "FeatureCollection" && newFeature.features?.length > 0) {
      geometryToUseForUnion = {
        type: "GeometryCollection",
        geometries: newFeature.features.map((f: any) => f.geometry).filter(Boolean)
      };
    } else if (newFeature.type === "Feature") {
      geometryToUseForUnion = newFeature.geometry;
    }

    if (!geometryToUseForUnion || !geometryToUseForUnion.type) {
      return apiError("Geometria não encontrada.", 400);
    }

    const geoJsonStringUnion = JSON.stringify(geometryToUseForUnion);

    // Transaction for atomic save
    await db.transaction(async (tx) => {
      // 1. Expand boundary (Update region geometry)
      if (expandBoundary) {
        await tx.execute(sql`
            UPDATE monitoramento.regioes
            SET geom = ST_Multi(ST_Simplify(
              ST_Union(
                geom,
                ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonStringUnion}), 4674)
              ),
              0.0001
            )),
            updated_at = now()
            WHERE id = ${regionId}
         `);
      }


    });

    // Revalidate layer catalog cache
    revalidateTag(`layerCatalog-${regionId}`);

    return apiSuccess({ message: "Operação concluída com sucesso." });

  } catch (error) {
    console.error("Failed to commit region union expansion", error);
    return apiError("Falha ao salvar as alterações de território.", 500);
  }
}
