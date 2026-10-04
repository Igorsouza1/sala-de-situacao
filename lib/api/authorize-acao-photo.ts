import { apiError } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/require-auth";
import { requireWriteRegion } from "@/lib/api/require-write-region";
import { findAcaoById } from "@/lib/repositories/acoesRepository";

/** Authorizes photo uploads and hides actions outside the caller's tenant. */
export async function authorizeAcaoPhotoUpload(acaoId: number) {
  const { user, tenantId, response } = await requireRole("editor");
  if (response) return { response };

  const acao = await findAcaoById(acaoId, tenantId);
  if (!acao) return { response: apiError("Ação não encontrada", 404) };

  const region = await requireWriteRegion(user!, tenantId!, String(acao.regiao_id));
  return { response: region.response };
}
