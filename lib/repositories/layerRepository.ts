import { db } from "@/db";
import { MapFeatureCollection } from "@/types/map-dto";
import { sql, eq, desc } from "drizzle-orm";
import { layerCatalogInMonitoramento, propriedadesInMonitoramento } from "@/db/schema";

/**
 * Validates that a table slug contains only safe characters.
 * Allows alphanumeric characters and underscores.
 */
function isValidTableSlug(slug: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(slug);
}

/**
 * Fetches a GeoJSON FeatureCollection directly from the database for a given table.
 * 
 * @param tableSlug The name of the table (must match regex ^[a-zA-Z0-9_]+$)
 * @param schema The database schema, defaults to 'monitoramento'
 * @returns A GeoJSON FeatureCollection
 */
export async function getGenericLayerData(layerId: number, schema: string = 'monitoramento'): Promise<MapFeatureCollection> {

    // Query otimizada usando as funções JSON do PostGIS
    const query = sql`
        SELECT json_build_object(
            'type', 'FeatureCollection',
            'features', COALESCE(
                json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'id', ld.id,
                        'geometry', ST_AsGeoJSON(ld.geom)::json,
                        'properties', ld.properties
                    )
                ), 
                '[]'::json
            )
        ) AS geojson
        FROM ${sql.identifier(schema)}."layer_data" AS ld
        WHERE ld.layer_id = ${layerId};
    `;

    try {
        const result = await db.execute<{ geojson: MapFeatureCollection }>(query);
        return result.rows[0]?.geojson || { type: "FeatureCollection", features: [] };
    } catch (error) {
        console.error(`Erro ao buscar layer_data para layer_id ${layerId}:`, error);
        // Retorna vazio em vez de quebrar, pois pode ser que a camada apenas não tenha dados ainda
        return { type: "FeatureCollection", features: [] };
    }
}

/**
 * Fetches the configuration for a specific layer from the catalog.
 */
export async function getLayerCatalog(slug: string) {
    const result = await db
        .select()
        .from(layerCatalogInMonitoramento)
        .where(eq(layerCatalogInMonitoramento.slug, slug))
        .limit(1);

    return result[0];
}


export async function findAllPropriedadesDataWithGeometry() {
    return await db.select().from(propriedadesInMonitoramento).orderBy(desc(propriedadesInMonitoramento.id));
}

