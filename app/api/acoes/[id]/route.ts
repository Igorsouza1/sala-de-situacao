import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAcaoDossie, updateAcaoFieldsById } from "@/lib/service/acoesService";
import { revalidateTag } from "next/cache";

// Update this type definition
type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    // Await the params directly from context
    const { id } = await context.params;
    const numId = Number(id);

    const formData = await request.formData();
    const result = await updateAcaoFieldsById(numId, formData);
    revalidateTag("acoes");
    return apiSuccess(result);
  } catch (error) {
    console.error("Erro ao atualizar ação:", error);
    return apiError("Erro ao atualizar ação", 500);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    // Await the params directly from context
    const { id } = await context.params;
    const numId = Number(id);

    if (Number.isNaN(numId)) {
      return apiError("ID inválido", 400);
    }

    const result = await getAcaoDossie(numId);

    if (!result) {
      return apiError("Ação não encontrada", 404);
    }

    return apiSuccess(result);
  } catch (error: any) {
    if (error.message === "Ação não encontrada") {
      return apiError(error.message, 404);
    }
    console.error("Erro ao buscar dossiê da ação:", error);
    return apiError("Erro ao buscar dossiê da ação", 500);
  }
}