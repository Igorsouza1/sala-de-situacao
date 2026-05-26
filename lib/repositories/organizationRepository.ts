import { db } from "@/db";
import { sql } from "drizzle-orm";

export interface AdminOrganizationData {
    organizationId: string;
    organizationName: string;
    regionId: number;
    regionName: string;
    regionDescription: string | null;
}

export async function getAdminOrganizationsData(): Promise<AdminOrganizationData[]> {
    const query = sql`
    SELECT
      o.id   AS "organizationId",
      o.name AS "organizationName",
      r.id   AS "regionId",
      r.nome AS "regionName",
      r.descricao AS "regionDescription"
    FROM monitoramento.regioes r
    JOIN monitoramento.tenants o
      ON o.id::text = r.metadata->>'organizationId'
    ORDER BY o.name ASC, r.nome ASC
  `;

    const result = await db.execute(query);

    return result.rows as unknown as AdminOrganizationData[];
}
