// app/api/acoes/[id]/upload-url/route.ts
import { apiError, apiSuccess } from "@/lib/api/responses"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = "acoes"

export async function POST(request: Request, context: any) {
  try {
    const { id } = await context.params as { id: string }
    const acaoId = Number(id)

    if (Number.isNaN(acaoId)) {
      return apiError("ID de ação inválido", 400)
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body.fileName !== "string" || !body.fileName.trim()) {
      return apiError("fileName é obrigatório", 400)
    }

    const path = `${acaoId}/${Date.now()}-${body.fileName}`
    const supabase = createAdminClient()

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path)

    if (error || !data) {
      throw new Error(error?.message || "Erro ao gerar URL de upload")
    }

    const blobUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`

    return apiSuccess({ uploadUrl: data.signedUrl, blobUrl })
  } catch (error) {
    console.error("Erro ao gerar URL de upload:", error)
    return apiError("Erro ao gerar URL de upload", 500)
  }
}
