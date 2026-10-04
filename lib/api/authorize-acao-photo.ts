import { apiError } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/require-auth";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";
import { getTenantIdForRegion } from "@/lib/api/scope";
import { findAcaoById } from "@/lib/repositories/acoesRepository";

/** Authorizes photo uploads and hides actions outside the caller's tenant. */
export async function authorizeAcaoPhotoUpload(acaoId: number) {
  const { user, tenantId, response } = await requireRole("editor");
  if (response) return { response };

  const acao = await findAcaoById(acaoId, tenantId);
  if (!acao) return { response: apiError("Ação não encontrada", 404) };

  const regionId = Number(acao.regiao_id);
  if (!Number.isInteger(regionId) || regionId <= 0 || await getTenantIdForRegion(regionId) !== tenantId) {
    return { response: apiError("Action outside accessible regions", 403) };
  }
  const regions = await getAccessibleRegionIdsForUser(user!.id, tenantId!, user!.app_metadata?.is_superadmin === true);
  if (regions !== null && !regions.includes(regionId)) {
    return { response: apiError("Action outside accessible regions", 403) };
  }
  return { response: null };
}
