import { NextResponse } from "next/server";
import { requireAuthWithTenant } from "@/lib/api/require-auth";
import { getRegionIdsForUser } from "@/lib/api/require-region";
import { db } from "@/db";
import { sql } from "drizzle-orm";

type BBoxRow = {
  nome: string | null;
  centroid_lng: number;
  centroid_lat: number;
  bbox_min_lng: number;
  bbox_min_lat: number;
  bbox_max_lng: number;
  bbox_max_lat: number;
  count: number;
};

const BBOX_COLS = sql`
  MIN(nome)                                                 AS nome,
  ST_X(ST_Centroid(ST_Union(geom::geometry)))               AS centroid_lng,
  ST_Y(ST_Centroid(ST_Union(geom::geometry)))               AS centroid_lat,
  ST_XMin(ST_Extent(geom::geometry))                        AS bbox_min_lng,
  ST_YMin(ST_Extent(geom::geometry))                        AS bbox_min_lat,
  ST_XMax(ST_Extent(geom::geometry))                        AS bbox_max_lng,
  ST_YMax(ST_Extent(geom::geometry))                        AS bbox_max_lat,
  COUNT(*)::int                                             AS count
`;

async function allRegionsBBox(): Promise<BBoxRow | null> {
  const r = await db.execute<BBoxRow>(sql`SELECT ${BBOX_COLS} FROM monitoramento.regioes`);
  return r.rows[0] ?? null;
}

async function tenantRegionsBBox(tenantId: string): Promise<BBoxRow | null> {
  const r = await db.execute<BBoxRow>(sql`
    SELECT ${BBOX_COLS}
    FROM monitoramento.regioes
    WHERE metadata->>'organizationId' = ${tenantId}
  `);
  return r.rows[0] ?? null;
}

async function specificRegionsBBox(ids: number[]): Promise<BBoxRow | null> {
  if (ids.length === 0) return null;
  const idList = sql.join(ids.map(id => sql`${id}`), sql`, `);
  const r = await db.execute<BBoxRow>(sql`
    SELECT ${BBOX_COLS}
    FROM monitoramento.regioes
    WHERE id IN (${idList})
  `);
  return r.rows[0] ?? null;
}

async function firstTenantRegionBBox(tenantId: string): Promise<BBoxRow | null> {
  const r = await db.execute<BBoxRow>(sql`
    SELECT ${BBOX_COLS}
    FROM (
      SELECT * FROM monitoramento.regioes
      WHERE metadata->>'organizationId' = ${tenantId}
      ORDER BY created_at DESC
      LIMIT 1
    ) sub
  `);
  return r.rows[0] ?? null;
}

export async function GET(request: Request) {
  const { user, tenantId, response: authResponse } = await requireAuthWithTenant();
  if (authResponse) return authResponse;

  // regiao_id explícito (admin navegando para uma região específica)
  const url = new URL(request.url)
  const regiaoIdOverride = url.searchParams.get('regiao_id')
  if (regiaoIdOverride) {
    const id = parseInt(regiaoIdOverride, 10)
    if (!Number.isNaN(id)) {
      const row = await specificRegionsBBox([id])
      if (!row || row.count === 0) return NextResponse.json(null)
      return NextResponse.json({
        nome: row.nome,
        center: [row.centroid_lng, row.centroid_lat] as [number, number],
        bbox: [row.bbox_min_lng, row.bbox_min_lat, row.bbox_max_lng, row.bbox_max_lat] as [number, number, number, number],
      }, { headers: { 'Cache-Control': 'private, no-store' } })
    }
  }

  const isSuperAdmin = user?.app_metadata?.is_superadmin === true;

  let row: BBoxRow | null = null;

  if (isSuperAdmin) {
    row = await allRegionsBBox();
  } else {
    // Owner e Admin têm acesso a todas as regiões do tenant (ADR-0003)
    const orgAdminCheck = await db.execute<{ ok: boolean }>(sql`
      SELECT EXISTS (
        SELECT 1 FROM monitoramento.roles
        WHERE user_id  = ${user!.id}::uuid
          AND tenant_id = ${tenantId}::uuid
          AND role IN ('owner', 'admin')
      ) AS ok
    `);

    if (orgAdminCheck.rows[0]?.ok) {
      row = await tenantRegionsBBox(tenantId!);
    } else {
      const regionIds = await getRegionIdsForUser(user!.id, tenantId!);
      if (regionIds.length > 0) {
        row = await specificRegionsBBox(regionIds);
      } else {
        row = await firstTenantRegionBBox(tenantId!);
      }
    }
  }

  if (!row || row.count === 0) return NextResponse.json(null);

  return NextResponse.json({
    nome: row.nome,
    center: [row.centroid_lng, row.centroid_lat] as [number, number],
    bbox: [row.bbox_min_lng, row.bbox_min_lat, row.bbox_max_lng, row.bbox_max_lat] as [number, number, number, number],
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
