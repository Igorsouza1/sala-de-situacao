import { apiError, apiSuccess } from "@/lib/api/responses";
import { z } from "zod";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { regioesInMonitoramento, layerCatalogInMonitoramento, layerDataInMonitoramento } from "@/db/schema";
import { revalidateTag } from "next/cache";
import slugify from "slugify";

const commitPayloadSchema = z.object({
  expandBoundary: z.boolean(),
  createBaseLayer: z.boolean(),
  insertMode: z.enum(["single", "split"]).optional().default("single"),
  newFeature: z.any(),
  layerConfig: z.object({
    name: z.string().min(1),
    color: z.string(),
    fillOpacity: z.number().min(0).max(1),
    weight: z.number().min(1)
  }).optional()
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) return apiError("ID da região inválido.", 400);

    const json = await request.json().catch(() => null);
    if (!json) return apiError("Body JSON é obrigatório.", 400);

    const parsed = commitPayloadSchema.safeParse(json);
    if (!parsed.success) return apiError("Payload inválido.", 400);

    const { expandBoundary, createBaseLayer, insertMode, newFeature, layerConfig } = parsed.data;

    // Extract geometry for DB functions
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
      return apiError("Geometria não encontrada.", 400);
    }

    const geoJsonString = JSON.stringify(geometryToUse);

    // Transaction for atomic save
    await db.transaction(async (tx) => {
      // 1. Expand boundary (Update region geometry)
      if (expandBoundary) {
        await tx.execute(sql`
            UPDATE monitoramento.regioes
            SET geom = ST_Multi(ST_Simplify(
              ST_Union(
                geom,
                ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonString}), 4674)
              ),
              0.0001
            )),
            updated_at = now()
            WHERE id = ${regionId}
         `);
      }

      // 2. Create Base Layer
      if (createBaseLayer && layerConfig) {
        let itemsToInsert = [newFeature];

        if (insertMode === "split") {
          if (newFeature.type === "FeatureCollection" && newFeature.features?.length > 1) {
            itemsToInsert = newFeature.features;
          } else if (newFeature.type === "MultiPolygon") {
            itemsToInsert = newFeature.coordinates.map((coords: any) => ({
              type: "Polygon",
              coordinates: coords
            }));
          } else if (newFeature.type === "Feature" && newFeature.geometry?.type === "MultiPolygon") {
            itemsToInsert = newFeature.geometry.coordinates.map((coords: any) => ({
              type: "Feature",
              geometry: { type: "Polygon", coordinates: coords },
              properties: newFeature.properties
            }));
          }
        }

        for (let i = 0; i < itemsToInsert.length; i++) {
          const item = itemsToInsert[i];
          const itemName = itemsToInsert.length > 1 ? `${layerConfig.name} - Parte ${i + 1}` : layerConfig.name;

          const slugBase = slugify(itemName, { lower: true, strict: true });
          let uniqueSlug = slugBase;

          const existingSlug = await tx.execute(sql`SELECT slug FROM monitoramento.layer_catalog WHERE slug LIKE ${slugBase + '%'}`);
          if (existingSlug && existingSlug.rowCount && existingSlug.rowCount > 0) {
            uniqueSlug = `${slugBase}-${Date.now().toString().slice(-4)}-${i}`;
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

          // Extract geometry for this specific chunk
          let chunkGeometry = item;
          if (item.type === "Feature") chunkGeometry = item.geometry;
          if (!chunkGeometry || !chunkGeometry.type) continue;
          const chunkGeoJsonString = JSON.stringify(chunkGeometry);

          // Insert into catalog
          const catalogResult = await tx.insert(layerCatalogInMonitoramento)
            .values({
              name: itemName,
              slug: uniqueSlug,
              regiaoId: regionId,
              visualConfig: visualConfig,
              schemaConfig: { source: "upload" },
              ordering: 0
            })
            .returning({ id: layerCatalogInMonitoramento.id });

          const newLayerId = catalogResult[0].id;

          // Insert the data into layer_data table
          await tx.execute(sql`
             INSERT INTO monitoramento.layer_data (layer_id, geom, properties, data_registro)
             VALUES (
               ${newLayerId},
               ST_SetSRID(ST_GeomFromGeoJSON(${chunkGeoJsonString}), 4674),
               ${JSON.stringify(item.properties || {})},
               now()
             )
           `);
        }
      }
    });

    // Revalidate layer catalog cache
    revalidateTag(`layerCatalog-${regionId}`);

    return apiSuccess({ message: "Operação concluída com sucesso." });

  } catch (error) {
    console.error("Failed to commit region union / base layer", error);
    return apiError("Falha ao salvar as alterações de território.", 500);
  }
}
