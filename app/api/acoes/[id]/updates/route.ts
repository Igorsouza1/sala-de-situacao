import { apiError, apiSuccess } from "@/lib/api/responses"
import { addAcaoUpdate, deleteAcaoItemHistoryById } from "@/lib/service/acoesService"
import { revalidateTag } from "next/cache"

// POST /api/acoes/[id]/updates
export async function POST(
  request: Request,
  context: any, // <- deixa como any / sem tipo
) {
  try {
    const { id } = context.params as { id: string }
    const numId = Number(id)

    if (Number.isNaN(numId)) {
      return apiError("ID de ação inválido", 400)
    }

    const formData = await request.formData()

    const file = formData.get("file")
    const descricao = formData.get("descricao")
    const data = formData.get("data")

    const result = await addAcaoUpdate(numId, {
      file: file instanceof File ? file : undefined,
      descricao:
        typeof descricao === "string" && descricao.trim()
          ? descricao.trim()
          : undefined,
      // se o service já aceita data, beleza; se não, comenta essa linha
      // @ts-expect-error se a assinatura ainda não tiver data
      data: typeof data === "string" && data.trim() ? data : undefined,
    })

    revalidateTag("acoes")
    return apiSuccess(result)
  } catch (error) {
    console.error("Erro ao atualizar ação:", error)
    return apiError("Erro ao atualizar ação", 500)
  }
}

// DELETE /api/acoes/[id]/updates?updateId=123
export async function DELETE(
  request: Request,
  context: any, // <- mesmo esquema aqui
) {
  try {
    const { id } = await context.params as { id: string }
    const acaoId = Number(id)

    if (Number.isNaN(acaoId)) {
      return apiError("ID de ação inválido", 400)
    }

    const url = new URL(request.url)
    const updateIdParam = url.searchParams.get("updateId")

    if (!updateIdParam) {
      return apiError("Parâmetro 'updateId' é obrigatório", 400)
    }

    const updateId = Number(updateIdParam)
    if (Number.isNaN(updateId)) {
      return apiError("ID de update inválido", 400)
    }

    const result = await deleteAcaoItemHistoryById(updateId)

    revalidateTag("acoes")
    return apiSuccess(result)
  } catch (error) {
    console.error("Erro ao excluir update:", error)
    return apiError("Erro ao excluir update", 500)
  }
}
