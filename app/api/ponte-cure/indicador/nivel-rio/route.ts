import { apiError, apiSuccess } from "@/lib/api/responses";
import { getNivelRioComparativoPct } from "@/lib/service/ponteService";

export async function GET() {
  try {
    const ponteData = await getNivelRioComparativoPct();
    return apiSuccess(ponteData);
  } catch (error: any) {
    console.error(error);
    return apiError(error?.message || "Erro ao buscar dados do nível do rio", 500);
  }
}
