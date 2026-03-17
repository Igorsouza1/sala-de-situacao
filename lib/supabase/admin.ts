import { createClient } from "@supabase/supabase-js"

// ⛔ Usar apenas em server (route handlers, service layer)
// Nunca expor SUPABASE_SERVICE_ROLE_KEY no client bundle
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios")
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}
