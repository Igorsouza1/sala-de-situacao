import { apiError, apiSuccess } from "@/lib/api/responses";
import { getchuvaComparativoPct } from "@/lib/service/dequeService";

export async function GET() {
  try {
    const dequeData = await getchuvaComparativoPct();
    return apiSuccess(dequeData);
  } catch (error: any) {
    console.error(error);
    return apiError(error?.message || "Erro ao buscar dados do nível do rio", 500);
  }
}
