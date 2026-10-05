import { NextRequest } from "next/server";
import { resolveScope } from "@/lib/api/scope";
import { parseRegiaoIdParam } from "@/lib/api/region-id";
import { getRegionIdsForUser } from "@/lib/api/require-region";
import { getLayerCatalog } from "@/lib/repositories/layerRepository";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const maxDuration = 30;
const ALLOWED_TABLES = new Set(['acoes', 'estradas', 'desmatamento', 'raw_firms', 'propriedades']);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; z: string; x: string; y: string }> }
) {
    const requested = parseRegiaoIdParam(request.nextUrl.searchParams);
    if (!requested.ok) {
        return new Response('Invalid region', { status: 400 });
    }
    const requestedRegion = requested.id;
    const scope = await resolveScope({ regiaoId: requestedRegion });
    if (scope.response) return scope.response;
    const { user, tenantId } = scope;
    const { slug, z, x, y } = await params;
    const [zInt, xInt, yInt] = [z, x, y].map(Number);
    if (![zInt, xInt, yInt].every(Number.isInteger) || zInt < 0 || zInt > 22 ||
        xInt < 0 || yInt < 0 || xInt >= 2 ** zInt || yInt >= 2 ** zInt) {
        return new Response('Invalid tile coordinates', { status: 400 });
    }
    const catalog = await getLayerCatalog(slug);
    if (!catalog) return new Response('Layer not found', { status: 404 });
    const global = catalog.scope === 'global' || catalog.tenantId === null;
    if (!global && catalog.tenantId !== tenantId) {
        return new Response('Layer belongs to another organization', { status: 403 });
    }
    const sc = catalog.schemaConfig as any;
    const tableName: string | undefined = sc?.tableName;
    const geometryColumn: string = sc?.geometryColumn ?? 'geom';
    if (!tableName || !ALLOWED_TABLES.has(tableName)) {
        return new Response('Layer not eligible for MVT', { status: 403 });
    }
    try {
        // Organization data and base data remain scoped even under a global catalog entry.
        let regionFilter = sql``;
        const superadmin = user.app_metadata?.is_superadmin === true;
        const owner = superadmin || (await db.execute<{ ok: boolean }>(sql`
                SELECT EXISTS (SELECT 1 FROM monitoramento.roles
                WHERE user_id = ${user.id}::uuid AND tenant_id = ${tenantId}::uuid
                AND role = 'owner') AS ok
        `)).rows[0]?.ok === true;
        const ids = owner ? null : await getRegionIdsForUser(user.id, tenantId);
        if (requestedRegion !== null && ids !== null && !ids.includes(requestedRegion)) {
            return new Response('Region not accessible', { status: 403 });
        }
        if (requestedRegion !== null) regionFilter = sql` AND r.id = ${requestedRegion}`;
        else if (ids !== null) regionFilter = ids.length
            ? sql` AND r.id IN (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
            : sql` AND FALSE`;
        const regionOwnership = sql`r.organization_id = ${tenantId}::uuid ${regionFilter}`;
        let dataFilter;
        if (tableName === 'raw_firms' || tableName === 'desmatamento') {
            const junction = tableName === 'raw_firms' ? 'firms_regioes' : 'desmatamento_regioes';
            const foreignKey = tableName === 'raw_firms' ? 'firm_id' : 'desmatamento_id';
            dataFilter = sql`EXISTS (SELECT 1 FROM monitoramento.${sql.identifier(junction)} j
                JOIN monitoramento.regioes r ON r.id = j.regiao_id
                WHERE j.${sql.identifier(foreignKey)} = t.id AND ${regionOwnership})`;
        } else if (tableName === 'propriedades') {
            dataFilter = sql`EXISTS (SELECT 1 FROM monitoramento.regioes r
                WHERE ${regionOwnership} AND ST_Intersects(t.${sql.identifier(geometryColumn)}, r.geom))`;
        } else {
            dataFilter = sql`t.tenant_id = ${tenantId}::uuid AND EXISTS (
                SELECT 1 FROM monitoramento.regioes r WHERE r.id = t.regiao_id AND ${regionOwnership})`;
        }
        const geom = sql`t.${sql.identifier(geometryColumn)}`;
        const result = await db.execute<{ st_asmvt: Buffer }>(sql`
            SELECT ST_AsMVT(tile, ${slug}, 4096, 'mvt_geom') AS st_asmvt
            FROM (
                SELECT t.id,
                    ST_AsMVTGeom(ST_Transform(${geom}, 3857),
                        ST_TileEnvelope(${zInt}, ${xInt}, ${yInt}), 4096, 256, true) AS mvt_geom
                FROM monitoramento.${sql.identifier(tableName)} t
                WHERE ${dataFilter} AND ST_Intersects(${geom},
                    ST_Transform(ST_TileEnvelope(${zInt}, ${xInt}, ${yInt}), ST_SRID(${geom})))
            ) tile WHERE tile.mvt_geom IS NOT NULL
        `);
        const mvtBuffer = result.rows[0]?.st_asmvt;
        if (!mvtBuffer || mvtBuffer.length === 0) {
            return new Response(null, { status: 204, headers: { 'Content-Type': 'application/x-protobuf', 'Cache-Control': 'private, no-store' } });
        }
        return new Response(mvtBuffer as any, { status: 200, headers: {
            'Content-Type': 'application/x-protobuf', 'Cache-Control': 'private, no-store',
        } });
    } catch (error) {
        console.error(`MVT tile error for ${slug} (${z}/${x}/${y}):`, error);
        return new Response('Failed to generate tile', { status: 500 });
    }
}
