import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) return apiError("ID da região inválido.", 400);

    const formData = await request.formData().catch(() => null);
    if (!formData) return apiError("FormData é obrigatório.", 400);

    const expandBoundaryStr = formData.get("expandBoundary");
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

      // 2. Create Base Layer using BATCH inserts for performance
      if (createBaseLayer && layerConfig) {
        const slugBase = slugify(layerConfig.name, { lower: true, strict: true });
        let uniqueSlug = slugBase;

        const existingSlug = await tx.execute(sql`SELECT slug FROM monitoramento.layer_catalog WHERE slug LIKE ${slugBase + '%'}`);
        if (existingSlug.rowCount && existingSlug.rowCount > 0) {
          uniqueSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;
        }

        const visualConfig = {
          category: "Base Territorial",
          defaultVisibility: true,
          baseStyle: {
            type: "polygon",
            color: layerConfig.color,
            fillOpacity: layerConfig.fillOpacity,
            weight: layerConfig.weight
          }
        };

        // Insert into catalog
        const catalogResult = await tx.insert(layerCatalogInMonitoramento)
          .values({
            name: layerConfig.name,
            slug: uniqueSlug,
            regiaoId: regionId,
            visualConfig: visualConfig,
            schemaConfig: { source: "upload" },
            ordering: 0
          })
          .returning({ id: layerCatalogInMonitoramento.id });

        const newLayerId = catalogResult[0].id;

        // Insert the data into layer_data table using batching
        if (newFeature.type === "FeatureCollection" && newFeature.features) {
          const batchSize = 500;
          for (let i = 0; i < newFeature.features.length; i += batchSize) {
            const batch = newFeature.features.slice(i, i + batchSize);

            const insertData = batch.filter((f: any) => f.geometry).map((feature: any) => ({
              layerId: newLayerId,
              geom: sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(feature.geometry)}), 4674)`,
              properties: feature.properties || {},
              dataRegistro: new Date().toISOString()
            }));

            if (insertData.length > 0) {
              await tx.insert(layerDataInMonitoramento).values(insertData);
            }
          }
        } else {
          // Single feature or geometry
          const geomToInsert = newFeature.type === "Feature" ? newFeature.geometry : newFeature;
          const props = newFeature.type === "Feature" ? newFeature.properties : {};

          await tx.insert(layerDataInMonitoramento).values({
            layerId: newLayerId,
            geom: sql`ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geomToInsert)}), 4674)`,
            properties: props || {},
            dataRegistro: new Date().toISOString()
          });
        }
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
