import { requireAuth } from "@/lib/api/require-auth";
import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAcoesByRegion } from "@/lib/service/adminService";

export async function GET(request: Request, context: any) {
  try {
    const { response: authResponse } = await requireAuth();
    if (authResponse) return authResponse;

    const { id } = await context.params as { id: string };
    const regionId = Number(id);

    if (Number.isNaN(regionId)) {
      return apiError("ID de região inválido", 400);
    }

    console.log("[DEBUG API] Buscando acoes para regiao:", regionId);
    const acoes = await getAcoesByRegion(regionId);
    console.log("[DEBUG API] Total acoes encontradas:", acoes.length);
    if (acoes.length > 0) {
      console.log("[DEBUG API] Primeira acao:", JSON.stringify(acoes[0], null, 2));
    }

    return apiSuccess(acoes);
  } catch (error) {
    console.error("Erro ao buscar ações:", error);
    return apiError("Erro interno ao buscar ações", 500);
  }
}
