import { NextResponse } from "next/server";
import { db } from "@/db";
import { layerCatalogInMonitoramento, layerDataInMonitoramento } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, color, regiaoId, geojson } = body;

        if (!name || !regiaoId || !geojson || !geojson.features) {
            return NextResponse.json(
                { message: "Dados incompletos." },
                { status: 400 }
            );
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();

        // Get max ordering
        const maxOrderingResult = await db.select({
            maxOrdering: sql<number>`max(${layerCatalogInMonitoramento.ordering})`
        }).from(layerCatalogInMonitoramento);
        const nextOrdering = (maxOrderingResult[0]?.maxOrdering || 0) + 1;

        const visualConfig = {
            category: "Uploads",
            color: color,
            fillColor: color,
            fillOpacity: 0.2,
            weight: 2
        };

        const result = await db.transaction(async (tx) => {
            // Insert catalog
            const [newLayer] = await tx.insert(layerCatalogInMonitoramento).values({
                name,
                slug,
                ordering: nextOrdering,
                visualConfig,
                schemaConfig: {
                    fields: [],
                    // Store the region reference inside schemaConfig as per the schema capabilities
                    regiaoId: regiaoId
                }
            }).returning();

            // Prepare features
            const insertValues = geojson.features.map((feature: any) => {
                const geomJson = JSON.stringify(feature.geometry);
                const props = feature.properties || {};

                return {
                    layerId: newLayer.id,
                    properties: props,
                    dataRegistro: new Date().toISOString(),
                    // Transform to SRID 4674, make valid, and simplify
                    geom: sql`ST_Simplify(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4674)), 0.0001)`
                };
            });

            // Batch insert features em blocos menores para evitar excesso de paramentros no Postgres
            const chunkSize = 1000;
            for (let i = 0; i < insertValues.length; i += chunkSize) {
                const chunk = insertValues.slice(i, i + chunkSize);
                if (chunk.length > 0) {
                    await tx.insert(layerDataInMonitoramento).values(chunk);
                }
            }

            return newLayer;
        });

        return NextResponse.json({ success: true, layer: result }, { status: 201 });

    } catch (error: any) {
        console.error("Erro no upload de layer:", error);
        return NextResponse.json(
            { message: "Erro ao salvar a camada: " + error.message },
            { status: 500 }
        );
    }
}
