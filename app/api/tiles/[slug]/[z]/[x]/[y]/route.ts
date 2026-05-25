import { NextRequest } from "next/server";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getLayerCatalog } from "@/lib/repositories/layerRepository";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const maxDuration = 30;

// Only native tables are eligible for MVT — layer_data handled via GeoJSON endpoint
const ALLOWED_TABLES = new Set([
    'acoes', 'estradas', 'desmatamento', 'raw_firms', 'propriedades',
]);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; z: string; x: string; y: string }> }
) {
    const { tenantId, response: authResponse } = await requireAuthWithTenant();
    if (authResponse) return authResponse;

    const { slug, z, x, y } = await params;

    const zInt = parseInt(z, 10);
    const xInt = parseInt(x, 10);
    const yInt = parseInt(y, 10);

    if (isNaN(zInt) || isNaN(xInt) || isNaN(yInt)) {
        return new Response('Invalid tile coordinates', { status: 400 });
    }

    const catalog = await getLayerCatalog(slug);
    if (!catalog) {
        return new Response('Layer not found', { status: 404 });
    }

    const sc = catalog.schemaConfig as any;
    const tableName: string | undefined = sc?.tableName;
    const geometryColumn: string = sc?.geometryColumn ?? 'geom';

    if (!tableName || !ALLOWED_TABLES.has(tableName)) {
        return new Response('Layer not eligible for MVT', { status: 403 });
    }

    try {
        const result = await db.execute<{ st_asmvt: Buffer }>(sql`
            SELECT ST_AsMVT(tile, ${slug}, 4096, 'mvt_geom') AS st_asmvt
            FROM (
                SELECT
                    id,
                    tenant_id,
                    ST_AsMVTGeom(
                        ${sql.identifier(geometryColumn)},
                        ST_TileEnvelope(${zInt}, ${xInt}, ${yInt}),
                        4096,
                        256,
                        true
                    ) AS mvt_geom
                FROM monitoramento.${sql.identifier(tableName)}
                WHERE tenant_id = ${tenantId}::uuid
                  AND ST_Intersects(
                      ${sql.identifier(geometryColumn)},
                      ST_TileEnvelope(${zInt}, ${xInt}, ${yInt})
                  )
            ) tile
            WHERE tile.mvt_geom IS NOT NULL
        `);

        const mvtBuffer = result.rows[0]?.st_asmvt;

        // Empty tile (no features in this tile)
        if (!mvtBuffer) {
            return new Response(Buffer.alloc(0), {
                status: 204,
                headers: { 'Content-Type': 'application/x-protobuf' },
            });
        }

        return new Response(mvtBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-protobuf',
                'Cache-Control': 'public, max-age=300',
            },
        });
    } catch (error) {
        console.error(`MVT tile error for ${slug} (${z}/${x}/${y}):`, error);
        return new Response('Failed to generate tile', { status: 500 });
    }
}
