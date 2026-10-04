import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses";
import { getNivelRioComparativoPct } from "@/lib/service/ponteService";

export async function GET() {
  const access = await requireStationAccess("ponte-cure", false)
  if (access.response) return access.response

  try {
    const ponteData = await getNivelRioComparativoPct(access.tenantId!);
    return apiSuccess(ponteData);
  } catch (error: any) {
    console.error(error);
    return apiError(error?.message || "Erro ao buscar dados do nível do rio", 500);
  }
}
