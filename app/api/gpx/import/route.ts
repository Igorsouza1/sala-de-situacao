import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { gpxImportRequestSchema } from "@/lib/validators/gpx-import";
import { importGpx } from "@/lib/service/gpxImportService";
import { revalidatePath } from "next/cache";

/**
 * POST /api/gpx/import
 * Importa arquivo GPX com trilha (opcional) e ações (waypoints)
 * Content-Type: multipart/form-data
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extrair dados JSON
    const regiaoIdRaw = formData.get("regiaoId");
    const trilhaRaw = formData.get("trilha");
    const acoesRaw = formData.get("acoes");

    // Validar regiaoId
    const regiaoId = regiaoIdRaw ? Number(regiaoIdRaw) : null;
    if (!regiaoId || !Number.isInteger(regiaoId) || regiaoId <= 0) {
      return apiError("regiaoId é obrigatório e deve ser um número inteiro positivo", 400);
    }

    // Validar acoes (obrigatório)
    if (!acoesRaw || typeof acoesRaw !== "string") {
      return apiError("acoes é obrigatório e deve ser um JSON string", 400);
    }

    let acoesParsed: any[];
    try {
      acoesParsed = JSON.parse(acoesRaw);
    } catch {
      return apiError("acoes deve ser um JSON válido", 400);
    }

    // Parse trilha (opcional)
    let trilhaParsed: any = undefined;
    if (trilhaRaw && typeof trilhaRaw === "string") {
      try {
        trilhaParsed = JSON.parse(trilhaRaw);
      } catch {
        return apiError("trilha deve ser um JSON válido", 400);
      }
    }

    // Montar payload para validação
    const requestPayload = {
      regiaoId,
      ...(trilhaParsed ? { trilha: trilhaParsed } : {}),
      acoes: acoesParsed,
    };



    // Validar com Zod
    const parsed = gpxImportRequestSchema.safeParse(requestPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            message: "Validação falhou",
            details: parsed.error.issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    // Extrair mapas de fotos: acoes[N]_fotos[M]
    const fotosMap: Record<number, { file: File; descricao?: string }[]> = {};
    for (const [key, value] of formData.entries()) {
      // Formato: acoes[0]_fotos[0], acoes[0]_fotosDesc[0], etc.
      if (value instanceof File && key.includes("_fotos[")) {
        const match = key.match(/acoes\[(\d+)\]_fotos\[(\d+)\]/);
        if (match) {
          const acaoIndex = parseInt(match[1], 10);
          const fotoIndex = parseInt(match[2], 10);

          if (!fotosMap[acaoIndex]) {
            fotosMap[acaoIndex] = [];
          }

          // Buscar descrição correspondente
          const descKey = `acoes[${acaoIndex}]_fotosDesc[${fotoIndex}]`;
          const descricao = formData.get(descKey);

          fotosMap[acaoIndex].push({
            file: value,
            descricao: typeof descricao === "string" ? descricao : undefined,
          });
        }
      }
    }

    // Anexar fotos às ações
    const acoesComFotos = parsed.data.acoes.map((acao, index) => {
      const fotos = fotosMap[index];
      return {
        ...acao,
        fotos: fotos
          ? fotos.map((f) => ({
            file: f.file,
            descricao: f.descricao,
          }))
          : undefined,
      };
    });

    // Chamar serviço de importação
    const result = await importGpx({
      regiaoId: parsed.data.regiaoId,
      trilha: parsed.data.trilha,
      acoes: acoesComFotos,
    });

    // Revalidar cache
    revalidatePath("/admin");

    return apiSuccess(
      {
        trilhaId: result.trilhaId,
        acoesIds: result.acoesIds,
        totalFotos: result.totalFotos,
      },
      201
    );
  } catch (error) {
    console.error("[ERRO] Falha ao processar importação GPX:", error);

    // Erro de validação do serviço
    if (error instanceof Error) {
      if (error.message.includes("não encontrada")) {
        return apiError(error.message, 404);
      }
      if (error.message.includes("Falha no upload")) {
        return apiError(error.message, 500);
      }
    }

    return apiError("Erro interno ao processar importação", 500);
  }
}
