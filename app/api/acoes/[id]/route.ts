import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAllAcoesImagesData, updateAcaoAndUploadImageById } from "@/lib/service/acoesService";


type RouteContext = { params: Record<string, string> }

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const formData = await request.formData();
    const result = await updateAcaoAndUploadImageById(id, formData);
    return apiSuccess(result);
  } catch (error) {
    console.error("Erro ao atualizar ação:", error);
    return apiError("Erro ao atualizar ação", 500);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    if (Number.isNaN(id)) {
      return apiError("ID inválido", 400);
    }

    const result = await getAllAcoesImagesData(id);

    if (!result || result.length === 0) {
      return apiError("Imagens não encontradas", 404);
    }

    return apiSuccess(result);
  } catch (error) {
    console.error("Erro ao buscar imagens:", error);
    return apiError("Erro ao buscar imagens", 500);
  }
}