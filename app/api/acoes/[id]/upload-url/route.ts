// app/api/acoes/[id]/upload-url/route.ts
import { apiError, apiSuccess } from "@/lib/api/responses"
import { getAzureUploadUrls } from "@/lib/azure"

export async function POST(request: Request, context: any) {
  try {
    const { id } = await context.params as { id: string }
    const acaoId = await Number(id)

    if (Number.isNaN(acaoId)) {
      return apiError("ID de ação inválido", 400)
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body.fileName !== "string" || !body.fileName.trim()) {
      return apiError("fileName é obrigatório", 400)
    }

    const path = `${acaoId}/${Date.now()}-${body.fileName}`
    const { uploadUrl, blobUrl } = getAzureUploadUrls(path)

    return apiSuccess({ uploadUrl, blobUrl })
  } catch (error) {
    console.error("Erro ao gerar URL de upload:", error)
    return apiError("Erro ao gerar URL de upload", 500)
  }
}
