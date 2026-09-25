import { cookies } from "next/headers";
import { ACTIVE_REGION_COOKIE, parseActiveRegionId } from "@/lib/api/active-region";

/** Lê a Região ativa do request atual. Fora de um request (ex.: jobs), retorna null. */
export async function readActiveRegionId(): Promise<number | null> {
  try {
    const store = await cookies();
    return parseActiveRegionId(store.get(ACTIVE_REGION_COOKIE)?.value);
  } catch {
    return null;
  }
}
