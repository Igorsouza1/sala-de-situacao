import { db } from "@/db";
import { sql } from "drizzle-orm";

export interface AdminOrganizationData {
    organizationId: string;
    organizationName: string;
    regionId: number;
    regionName: string;
    regionDescription: string | null;
    regionGeojson: string | null;
    sizeKm2: number;
}

export async function getAdminOrganizationsData(): Promise<AdminOrganizationData[]> {
    const query = sql`
    SELECT
      o.id   AS "organizationId",
      o.name AS "organizationName",
      r.id   AS "regionId",
      r.nome AS "regionName",
      r.descricao AS "regionDescription",
      ST_AsGeoJSON(ST_SimplifyPreserveTopology(r.geom, 0.001), 4) AS "regionGeojson",
      ROUND(COALESCE(ST_Area(r.geom::geography) / 1000000.0, 0)::numeric, 0)::float8 AS "sizeKm2"
    FROM monitoramento.regioes r
    JOIN monitoramento.tenants o
      ON o.id::text = r.metadata->>'organizationId'
    ORDER BY o.name ASC, r.nome ASC
  `;

    const result = await db.execute(query);

    return result.rows as unknown as AdminOrganizationData[];
}
