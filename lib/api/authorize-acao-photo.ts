import { apiError } from "@/lib/api/responses";
import { requireRole } from "@/lib/api/require-auth";
import { findAcaoById } from "@/lib/repositories/acoesRepository";

/** Authorizes photo uploads and hides actions outside the caller's tenant. */
export async function authorizeAcaoPhotoUpload(acaoId: number) {
  const { tenantId, response } = await requireRole("editor");
  if (response) return { response };

  const acao = await findAcaoById(acaoId, tenantId);
  if (!acao) return { response: apiError("Ação não encontrada", 404) };

  return { response: null };
}
