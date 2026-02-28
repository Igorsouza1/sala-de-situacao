import { db } from "@/db";
import { organizationsInMonitoramento, userAccessInMonitoramento, regioesInMonitoramento } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export interface AdminOrganizationData {
    organizationId: string;
    organizationName: string;
    regionId: number;
    regionName: string;
    regionDescription: string | null;
}

export async function getAdminOrganizationsData(): Promise<AdminOrganizationData[]> {
    const query = sql`
    SELECT DISTINCT
      o.id AS "organizationId",
      o.name AS "organizationName",
      r.id AS "regionId",
      r.nome AS "regionName",
      r.descricao AS "regionDescription"
    FROM "monitoramento"."organizations" o
    JOIN "monitoramento"."user_access" ua ON o.id = ua.organization_id
    JOIN "monitoramento"."regioes" r ON ua.regiao_id = r.id
    ORDER BY o.name ASC, r.nome ASC
  `;

    const result = await db.execute(query);

    return result.rows as unknown as AdminOrganizationData[];
}
