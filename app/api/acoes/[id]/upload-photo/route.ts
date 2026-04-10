import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { createAdminClient } from "@/lib/supabase/admin";
import { addAcaoImageById } from "@/lib/repositories/acoesRepository";

const BUCKET = "acoes";

export async function POST(request: Request, context: any) {
  try {
    const { id } = await context.params as { id: string };
    const acaoId = Number(id);

    if (Number.isNaN(acaoId)) {
      return apiError("ID de ação inválido", 400);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const descricao = formData.get("descricao") as string | null;

    if (!file) {
      return apiError("Arquivo é obrigatório", 400);
    }

    // Validar tipo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return apiError("Tipo de arquivo inválido. Use JPG, PNG ou WebP", 400);
    }

    // Validar tamanho (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return apiError("Arquivo muito grande. Máximo: 5MB", 400);
    }

    const supabase = createAdminClient();
    const timestamp = Date.now();
    const path = `${acaoId}/${timestamp}_${file.name}`;

    // Upload para Supabase
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro no upload Supabase:", uploadError);
      return apiError("Falha no upload: " + uploadError.message, 500);
    }

    // Obter URL pública (construir manualmente para evitar issues)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

    console.log("[DEBUG] URL pública construída:", publicUrl);

    // Registrar no banco
    await addAcaoImageById(
      acaoId,
      publicUrl,
      descricao || "",
      new Date()
    );

    console.log("[DEBUG] Foto registrada no banco com URL:", publicUrl);

    return apiSuccess({
      message: "Foto adicionada com sucesso",
      url: publicUrl,
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    return apiError("Erro interno ao fazer upload", 500);
  }
}
