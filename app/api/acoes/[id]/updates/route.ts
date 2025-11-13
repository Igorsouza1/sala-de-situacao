// app/api/acoes/[id]/updates/route.ts

import { apiError, apiSuccess } from "@/lib/api/responses";
import { addAcaoUpdate } from "@/lib/service/acoesService";
import { revalidateTag } from "next/cache";

/**
 * POST: Adiciona um novo item ao histórico (mídia ou descrição)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const numId = await Number(params.id);
    if (isNaN(numId)) return apiError("ID da ação inválido", 400);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const descricao = formData.get("descricao") as string | null;

    // Validação: precisa ter pelo menos arquivo ou descrição
    if (!file && !descricao) {
      return apiError("É necessário fornecer uma mídia ou uma descrição", 400);
    }

    const result = await addAcaoUpdate(numId, {
      file: file || undefined,
      descricao: descricao || undefined,
    });

    revalidateTag("acoes");

    return apiSuccess(result, 201);
  } catch (error: any) {
    console.error("Erro ao adicionar update:", error);
    return apiError(error.message || "Falha ao adicionar update", 500);
  }
}

