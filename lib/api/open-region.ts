import { parseRegionIdInput } from "@/lib/api/region-id";
import { OPEN_REGION_COOKIE } from "@/lib/open-region-cookie";

// A Região aberta no mapa (o `regiao_id` do endereço), guardada num cookie pelo proxy a cada página aberta. Serve só de PREFERÊNCIA
// para escolher a Organização da pessoa quando ela tem papel em mais de uma: as rotas que não recebem a Região (camada por nome,
// permissão de edição…) passam a falar da Organização da Região que está na tela. Nunca autoriza nada: a Organização escolhida
// ainda precisa ter um papel atual da pessoa (resolveTenantIdForUser).
export { OPEN_REGION_COOKIE };

export function parseOpenRegionCookie(raw: string | undefined): number | null {
  const parsed = parseRegionIdInput(raw);
  return parsed.ok ? parsed.id : null;
}

/** Lê o cookie da requisição atual; fora de uma requisição (testes, scripts) não há preferência. */
export async function readOpenRegionId(): Promise<number | null> {
  try {
    const { cookies } = await import("next/headers");
    return parseOpenRegionCookie((await cookies()).get(OPEN_REGION_COOKIE)?.value);
  } catch {
    return null;
  }
}
