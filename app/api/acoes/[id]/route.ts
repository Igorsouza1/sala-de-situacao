import { apiError, apiSuccess } from "@/lib/api/responses";
import { getAcaoDossie, updateAcaoFieldsById } from "@/lib/service/acoesService";
import { findAcaoById } from "@/lib/repositories/acoesRepository";
import { getAccessibleRegionIdsForUser } from "@/lib/api/require-region";
import { requireWriteRegion } from "@/lib/api/require-write-region";
import { requireAuthWithTenant, requireRole } from "@/lib/api/require-auth";
import { revalidateTag } from "next/cache";

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const { user, tenantId, response: authResponse } = await requireRole("editor");
  if (authResponse) return authResponse;

  try {
    const { id } = await context.params;
    const numId = Number(id);

    if (!Number.isInteger(numId) || numId <= 0) return apiError("ID invalido", 400);
    const acao = await findAcaoById(numId, tenantId);
    if (!acao) return apiError("Acao nao encontrada", 404);
    const region = await requireWriteRegion(user!, tenantId!, String(acao.regiao_id));
    if (region.response) return region.response;
    const formData = await request.formData();
    const result = await updateAcaoFieldsById(numId, formData, tenantId);
    revalidateTag("acoes", { expire: 0 });
    return apiSuccess(result);
  } catch (error) {
    console.error("Erro ao atualizar ação:", error);
    return apiError("Erro ao atualizar ação", 500);
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { user, tenantId, response: authResponse } = await requireAuthWithTenant();
  if (authResponse) return authResponse;

  try {
    const { id } = await context.params;
    const numId = Number(id);

    if (Number.isNaN(numId)) {
      return apiError("ID inválido", 400);
    }

    const regionIds = await getAccessibleRegionIdsForUser(user!.id, tenantId!, user?.app_metadata?.is_superadmin === true);
    const result = await getAcaoDossie(numId, tenantId, regionIds);

    if (!result) {
      return apiError("Ação não encontrada", 404);
    }

    return apiSuccess(result);
  } catch (error: any) {
    if (error.message === "Ação não encontrada") {
      return apiError(error.message, 404);
    }
    console.error("Erro ao buscar dossiê da ação:", error);
    return apiError("Erro ao buscar dossiê da ação", 500);
  }
}
