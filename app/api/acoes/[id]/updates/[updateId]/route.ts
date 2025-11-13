// app/api/acoes/[id]/updates/[updateId]/route.ts
// (ARQUIVO NOVO)

import { apiError, apiSuccess } from "@/lib/api/responses";
import { deleteAcaoUpdate, editAcaoUpdateDescricao } from "@/lib/service/acoesService";
import { revalidateTag } from "next/cache";

/**
 * DELETE: Deleta um item do histórico (foto ou texto)
 */
export async function DELETE(request: Request, { params }: { params: { updateId: string } }) {
  try {
    const numUpdateId = Number(params.updateId);
    if (isNaN(numUpdateId)) return apiError("ID da atualização inválido", 400);

    await deleteAcaoUpdate(numUpdateId);
    revalidateTag("acoes"); // Invalida o cache para o 'getAcaoDossie' buscar de novo

    return apiSuccess({ message: "Atualização deletada" }, 200);
  } catch (error: any) {
    return apiError(error.message || "Falha ao deletar", 500);
  }
}

/**
 * PATCH: Edita a descrição de um item do histórico
 */
export async function PATCH(request: Request, { params }: { params: { updateId: string } }) {
  try {
    const numUpdateId = Number(params.updateId);
    if (isNaN(numUpdateId)) return apiError("ID da atualização inválido", 400);

    const { descricao } = await request.json();
    if (typeof descricao !== 'string') return apiError("Descrição inválida", 400);

    const result = await editAcaoUpdateDescricao(numUpdateId, descricao);
    revalidateTag("acoes");

    return apiSuccess(result);
  } catch (error: any) {
    return apiError(error.message || "Falha ao editar", 500);
  }
}