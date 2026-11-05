// O nome e o formato do cookie da Região aberta, sem nada de servidor: o proxy grava ao abrir a página e o menu da conta grava
// antes de trocar de Região (para a troca não depender de a navegação passar pelo proxy). Ver lib/api/open-region.ts.
export const OPEN_REGION_COOKIE = "prisma_regiao";
export const OPEN_REGION_MAX_AGE = 60 * 60 * 24 * 365;

/** O cookie para `document.cookie`. Não é segredo nem permissão (só preferência), por isso não precisa ser httpOnly. */
export function openRegionCookie(id: number, secure: boolean): string {
  return `${OPEN_REGION_COOKIE}=${id}; path=/; max-age=${OPEN_REGION_MAX_AGE}; samesite=lax${secure ? "; secure" : ""}`;
}
