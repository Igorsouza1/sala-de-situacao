import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllAcoesImagesData, updateAcaoAndUploadImageById } from "@/lib/service/acoesService";


type RouteContext = { params: Record<string, string> }

export async function PUT(request: Request, context: any) {
  try {
    const { id } = context.params as { id: string };
    const numId = Number(id);

    const formData = await request.formData();
    const result = await updateAcaoAndUploadImageById(numId, formData);
    return apiSuccess(result);
  } catch (error) {
    console.error("Erro ao atualizar ação:", error);
    return apiError("Erro ao atualizar ação", 500);
  }
}

export async function GET(_request: Request, context: any) {
  try {
    const { id } = context.params as { id: string };
    const numId = Number(id);

    if (Number.isNaN(numId)) {
      return apiError("ID inválido", 400);
    }

    const result = await getAllAcoesImagesData(numId);
    if (!result || result.length === 0) {
      return apiError("Imagens não encontradas", 404);
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("Erro ao buscar imagens:", error);
    return apiError("Erro ao buscar imagens", 500);
  }
}
