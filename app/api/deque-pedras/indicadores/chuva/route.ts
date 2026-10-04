import { requireStationAccess } from "@/lib/api/station-access"
import { apiError, apiSuccess } from "@/lib/api/responses";
import { getchuvaComparativoPct } from "@/lib/service/dequeService";

export async function GET() {
  const access = await requireStationAccess("deque-pedras", false)
  if (access.response) return access.response

  try {
    const dequeData = await getchuvaComparativoPct(access.tenantId!);
    return apiSuccess(dequeData);
  } catch (error: any) {
    console.error(error);
    return apiError(error?.message || "Erro ao buscar dados do nível do rio", 500);
  }
}
