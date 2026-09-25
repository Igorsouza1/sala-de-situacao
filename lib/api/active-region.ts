import type { NextRequest, NextResponse } from "next/server";

/**
 * Região ativa do Superadmin.
 *
 * O Superadmin não pertence a um tenant só: o tenant efetivo das rotas vem da
 * Região que ele está visualizando. A Região só existe na URL de /protected
 * (`?regiao_id=N`), mas as chamadas de API (detalhe de ação, dossiê, tiles…)
 * não a carregam. O middleware copia o valor para este cookie, e
 * `requireAuthWithTenant` o usa — só para Superadmin — como fonte do tenant.
 *
 * O cookie é uma dica, não uma credencial: o tenant é sempre resolvido no banco
 * a partir do id da Região, e usuário comum nunca lê o cookie.
 *
 * Módulo puro (sem next/headers) para poder rodar no middleware.
 */
export const ACTIVE_REGION_COOKIE = "active_region_id";

export function parseActiveRegionId(raw: string | null | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/**
 * Mantém o cookie em sincronia com a URL de /protected: `?regiao_id=N` define a
 * Região ativa; abrir /protected sem o parâmetro limpa (volta ao padrão).
 */
export function syncActiveRegionCookie(request: NextRequest, response: NextResponse): void {
  if (!request.nextUrl.pathname.startsWith("/protected")) return;

  const regiaoId = parseActiveRegionId(request.nextUrl.searchParams.get("regiao_id"));
  if (regiaoId == null) {
    if (request.cookies.has(ACTIVE_REGION_COOKIE)) response.cookies.delete(ACTIVE_REGION_COOKIE);
    return;
  }

  response.cookies.set(ACTIVE_REGION_COOKIE, String(regiaoId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
