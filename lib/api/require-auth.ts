import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/api/responses";
import type { User } from "@supabase/supabase-js";

interface AuthResult {
  user: User | null;
  response: Response | null;
}

/**
 * Verifica se a requisição possui sessão ativa no Supabase.
 *
 * Uso em route handlers:
 * ```ts
 * const { user, response } = await requireAuth();
 * if (response) return response; // 401
 * // user está disponível aqui
 * ```
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      response: apiError("Não autorizado.", 401),
    };
  }

  return { user, response: null };
}
