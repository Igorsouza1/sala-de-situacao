import { apiError, apiSuccess } from "@/lib/api/responses"
import { addAcaoUpdate, deleteAcaoItemHistoryById } from "@/lib/service/acoesService"
import { revalidateTag } from "next/cache"

export async function POST(request: Request, context: any) {
  try {
    const { id } = await context.params as { id: string }
    const acaoId = Number(id)

    if (Number.isNaN(acaoId)) {
      return apiError("ID de ação inválido", 400)
    }

    const body = await request.json().catch(() => null)

    if (!body) {
      return apiError("Body JSON inválido", 400)
    }

    const {
      descricao,
      data,
      urlMidia,
    }: {
      descricao?: string
      data?: string
      urlMidia?: string | null
    } = body

    if (!descricao && !urlMidia) {
      return apiError("É necessário informar urlMidia ou descricao.", 400)
    }

    const atualizacao =
      data && data.trim() !== "" ? new Date(data) : new Date()

    await addAcaoUpdate(acaoId, {
      urlMidia: urlMidia ?? undefined,
      descricao: descricao?.trim() || undefined,
      atualizacao,
    })

    return apiSuccess({ message: "Registro adicionado com sucesso!" })
  } catch (error) {
    console.error("Erro ao adicionar update:", error)
    return apiError("Erro ao adicionar update", 500)
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
