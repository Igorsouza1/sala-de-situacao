import { db } from "@/db";
import { sql } from "drizzle-orm";
import { requireAuthWithTenant, requireRole } from "./require-auth";
import { apiError } from "./responses";

const stations = {
  "balneario-municipal": { table: "balneario_municipal", env: "BALNEARIO_TENANT_ID" },
  "deque-pedras": { table: "deque_de_pedras", env: "DEQUE_TENANT_ID" },
  "ponte-cure": { table: "ponte_do_cure", env: "PONTE_TENANT_ID" },
} as const;

/** Legacy stations each belong to one organization; no default organization. */
export async function requireStationAccess(station: keyof typeof stations, write = false) {
  const auth = await (write ? requireRole("editor") : requireAuthWithTenant());
  if (auth.response) return auth;
  const config = stations[station];
  let owner = process.env[config.env];
  if (!owner) {
    const result = await db.execute<{ tenant_id: string }>(sql`
      SELECT DISTINCT tenant_id::text AS tenant_id
      FROM monitoramento.${sql.identifier(config.table)} WHERE tenant_id IS NOT NULL
    `);
    // Ambiguous or empty ownership fails closed; dedicated configuration enables empty stations.
    if (result.rows.length === 1) owner = result.rows[0].tenant_id;
  }
  if (!owner) return { ...auth, response: apiError("Organiza??o da esta??o n?o configurada.", 403) };
  if (auth.tenantId !== owner && auth.user?.app_metadata?.is_superadmin !== true) {
    return { ...auth, response: apiError("Esta??o pertence a outra Organiza??o.", 403) };
  }
  return { ...auth, tenantId: owner };
}
