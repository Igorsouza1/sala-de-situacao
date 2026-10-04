import { apiError } from "@/lib/api/responses";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";
import { parseRegiaoIdParam, resolveScope } from "@/lib/api/scope";

/** Resolve tenant and every region granted to the user before querying base data. */
export async function resolveEnvironmentalReadScope(request: Request) {
  const requestedRegionId = parseRegiaoIdParam(new URL(request.url).searchParams);
  const scope = await resolveScope({ regiaoId: requestedRegionId });
  if (scope.response) return { response: scope.response } as const;

  const isSuperadmin = scope.user.app_metadata?.is_superadmin === true;
  const allowedRegions = await getAccessibleRegionIdsForUser(scope.user.id, scope.tenantId, isSuperadmin);
  if (allowedRegions !== null && (
    allowedRegions.length === 0 ||
    (requestedRegionId !== null && !allowedRegions.includes(requestedRegionId))
  )) {
    return { response: apiError("Região não acessível.", 403) } as const;
  }

  return {
    response: null,
    tenantId: scope.tenantId,
    isSuperadmin,
    regionFilter: requestedRegionId ?? allowedRegions ?? undefined,
  } as const;
}
