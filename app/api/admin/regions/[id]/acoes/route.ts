import { requireAuth } from "@/lib/api/require-auth";
import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAcoesByRegion, getRegionById } from "@/lib/service/adminService";
import { insertSingleAcaoData } from "@/lib/repositories/acoesRepository";
import { revalidatePath } from "next/cache";

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

export async function POST(request: Request, context: any) {
  try {
    const { response: authResponse } = await requireAuth();
    if (authResponse) return authResponse;

    const { id } = await context.params as { id: string };
    const regionId = Number(id);
    if (Number.isNaN(regionId)) return apiError("ID de região inválido", 400);

    const region = await getRegionById(regionId);
    if (!region) return apiError("Região não encontrada", 404);
    if (!region.organizationId) return apiError("Região sem tenant associado", 400);

    const body = await request.json();
    if (!body.name?.trim()) return apiError("Nome é obrigatório", 400);

    const newAcao = await insertSingleAcaoData({
      name: body.name.trim(),
      descricao: body.descricao ?? null,
      time: body.time ?? null,
      acao: body.acao ?? null,
      categoria: body.categoria ?? null,
      status: body.status ?? null,
      tipoTecnico: body.tipoTecnico ?? null,
      carater: body.carater ?? null,
      eixoTematico: body.eixoTematico ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      elevation: body.elevation ?? null,
      regiaoId: regionId,
      tenantId: region.organizationId,
    });

    revalidatePath(`/admin/regions/${regionId}`);
    return apiSuccess(newAcao, 201);
  } catch (error) {
    console.error("Erro ao criar ação:", error);
    return apiError("Falha ao criar ação", 500);
  }
}
