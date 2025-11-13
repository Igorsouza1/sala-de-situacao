import { apiError, apiSuccess } from "@/lib/api/responses";
import { addAcaoUpdate, deleteAcaoItemHistoryById } from "@/lib/service/acoesService";
import { revalidateTag } from "next/cache";

type RouteContext = { params: Record<string, string> }

// se o front tá usando POST, melhor alinhar aqui também
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params as { id: string }
    const numId = await Number(id)

    const formData = await request.formData()

    const file = formData.get("file")
    const descricao = formData.get("descricao")

    const result = await addAcaoUpdate(numId, {
      file: file instanceof File ? file : undefined,
      descricao: typeof descricao === "string" && descricao.trim() ? descricao.trim() : undefined,
    })

    revalidateTag("acoes")
    return apiSuccess(result)
  } catch (error) {
    console.error("Erro ao atualizar ação:", error)
    return apiError("Erro ao atualizar ação", 500)
  }
}



export async function DELETE(request: Request, context: RouteContext) {
    try {
      // se quiser, pode validar o id só pra garantir que veio algo
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