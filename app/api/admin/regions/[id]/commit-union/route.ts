import { apiError, apiSuccess } from "@/lib/api/responses";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { layerCatalogInMonitoramento, layerDataInMonitoramento } from "@/db/schema";
import { revalidateTag } from "next/cache";
import slugify from "slugify";

export const maxDuration = 60; // Allow more time for processing massive GeoJSON geometries

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const regionId = parseInt(params.id, 10);
    if (isNaN(regionId)) return apiError("ID da região inválido.", 400);

    const formData = await request.formData().catch((e) => {
      console.error("Erro ao fazer parse do FormData no upload final (arquivo muito grande?):", e);
      return null;
    });
    if (!formData) return apiError("FormData é obrigatório ou arquivo muito grande.", 400);

    const expandBoundaryStr = formData.get("expandBoundary");
    const createBaseLayerStr = formData.get("createBaseLayer");
    const layerConfigStr = formData.get("layerConfig");
    const file = formData.get("file") as File | null;
    const uploadId = formData.get("uploadId") as string | null;
    const totalChunksStr = formData.get("totalChunks") as string | null;

    if (!expandBoundaryStr || !createBaseLayerStr) return apiError("Valores booleanos requeridos", 400);
    if (!file && (!uploadId || !totalChunksStr)) return apiError("Arquivo original não fornecido.", 400);

    const expandBoundary = expandBoundaryStr === "true";
    const createBaseLayer = createBaseLayerStr === "true";

    let layerConfig: any = null;
    if (createBaseLayer && layerConfigStr) {
      layerConfig = JSON.parse(layerConfigStr.toString());
    }

    // Leitura do arquivo massivo no backend via arquivo unificado ou Chunks reconstruídos
    let fileContent = "";
    if (uploadId && totalChunksStr) {
      const totalChunks = parseInt(totalChunksStr, 10);
      try {
        const { assembleChunks } = await import("@/lib/chunk-upload");
        fileContent = assembleChunks(uploadId, totalChunks);
      } catch (e: any) {
        console.error("Assembly erro no Commit:", e);
        return apiError(e.message || "Erro ao unificar o arquivo GeoJSON final.", 500);
      }
    } else if (file) {
      fileContent = await file.text();
    }

    const newFeaturePreview = JSON.parse(fileContent.slice(0, Math.min(fileContent.length, 5000)) + (fileContent.length > 5000 ? '"}' : ''));
    // ^ Só precisamos saber o tipo raiz. Fazer parse inteiro congela tudo em arquivos de 30mb.
    let isFeatureCollection = fileContent.includes('"type":"FeatureCollection"') || fileContent.includes('"type": "FeatureCollection"');
    let isFeature = fileContent.includes('"type":"Feature"') || fileContent.includes('"type": "Feature"');

    // Geometry calculation for the union (Needs a single coherent geometry representation)
    const geoJsonStringUnion = fileContent; // PostGIS engole isso puro via C sem gargalar o Node.

    const extractGeomsCTE = sql`
      WITH payload AS (
        SELECT ${geoJsonStringUnion}::jsonb AS doc
      ),
      extracted_geoms AS (
        SELECT 
          CASE 
            WHEN doc->>'type' = 'FeatureCollection' THEN 
              (SELECT ST_Collect(ST_GeomFromGeoJSON(f->'geometry')) FROM jsonb_array_elements(doc->'features') AS f WHERE f->>'geometry' IS NOT NULL)
            WHEN doc->>'type' = 'Feature' THEN 
              ST_GeomFromGeoJSON(doc->'geometry')
            ELSE 
              ST_GeomFromGeoJSON(doc)
          END as geom
        FROM payload
      )
    `;

    // Transaction for atomic save
    await db.transaction(async (tx) => {
      // 1. Expand boundary (Update region geometry)
      if (expandBoundary) {
        await tx.execute(sql`
            ${extractGeomsCTE}
            UPDATE monitoramento.regioes
            SET geom = ST_Multi(ST_Simplify(
              ST_Union(
                geom,
                ST_SetSRID((SELECT geom FROM extracted_geoms), 4674)
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
        if (existingSlug && existingSlug.rowCount && existingSlug.rowCount > 0) {
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

        // Insert the data into layer_data table via PostgreSQL JSONB iteration (Zero V8 RAM bloating)
        if (isFeatureCollection) {
          await tx.execute(sql`
              INSERT INTO monitoramento.layer_data (layer_id, geom, properties, data_registro)
              SELECT 
                ${newLayerId},
                ST_SetSRID(ST_GeomFromGeoJSON(f->'geometry'), 4674),
                COALESCE(f->'properties', '{}'::jsonb),
                now()
              FROM jsonb_array_elements(${fileContent}::jsonb->'features') AS f
              WHERE f->>'geometry' IS NOT NULL;
            `);
        } else if (isFeature) {
          await tx.execute(sql`
              INSERT INTO monitoramento.layer_data (layer_id, geom, properties, data_registro)
              SELECT 
                ${newLayerId},
                ST_SetSRID(ST_GeomFromGeoJSON(${fileContent}::jsonb->'geometry'), 4674),
                COALESCE(${fileContent}::jsonb->'properties', '{}'::jsonb),
                now();
            `);
        } else {
          await tx.execute(sql`
              INSERT INTO monitoramento.layer_data (layer_id, geom, properties, data_registro)
              SELECT 
                ${newLayerId},
                ST_SetSRID(ST_GeomFromGeoJSON(${fileContent}::jsonb), 4674),
                '{}'::jsonb,
                now();
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
