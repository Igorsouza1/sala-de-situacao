import type { User } from "@supabase/supabase-js";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { apiError } from "./responses";
import { getRegionIdForUser } from "./require-region";
import { getTenantIdForRegion } from "./scope";

/** Region ownership and the writing role must both authorize the chosen region. */
export async function requireWriteRegion(user: User, tenantId: string, requested?: FormDataEntryValue | null) {
  const explicit = requested != null;
  const regionId = explicit ? Number(requested) : await getRegionIdForUser(user.id, tenantId);
  if (!regionId || !Number.isInteger(regionId) || regionId <= 0) {
    return { regionId: null, tenantId, response: apiError("Selecione uma regiao autorizada.", explicit ? 400 : 403) };
  }
  const regionTenant = await getTenantIdForRegion(regionId);
  if (!regionTenant) return { regionId, tenantId, response: apiError("Regiao nao encontrada.", 404) };
  if (user.app_metadata?.is_superadmin === true) return { regionId, tenantId: regionTenant, response: null };
  // o papel que conta é o da Organização dona da Região (a pessoa pode ter papel em mais de uma)
  const grant = await db.execute<{ ok: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM monitoramento.roles
      WHERE user_id = ${user.id}::uuid AND tenant_id = ${regionTenant}::uuid
        AND (role = 'owner' OR (role = 'editor' AND region_id = ${regionId}))) AS ok
  `);
  if (grant.rows[0]?.ok === true) return { regionId, tenantId: regionTenant, response: null };
  return {
    regionId,
    tenantId,
    response: apiError(regionTenant !== tenantId ? "Regiao pertence a outra organizacao." : "Sem permissao de escrita nesta regiao.", 403),
  };
}
