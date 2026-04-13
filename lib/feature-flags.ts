/**
 * Feature flags de ativação gradual.
 *
 * NEXT_PUBLIC_MULTI_TENANT=false (default):
 *   - Queries usam SEED_TENANT_ID do env → comportamento idêntico ao pré-Fase 2
 *   - Rollback instantâneo sem redeploy
 *
 * NEXT_PUBLIC_MULTI_TENANT=true:
 *   - tenant_id extraído do JWT de cada usuário
 *   - Isolamento real cross-tenant ativo
 */
export const FEATURES = {
  MULTI_TENANT: process.env.NEXT_PUBLIC_MULTI_TENANT === "true",
  MAP_ENGINE: process.env.NEXT_PUBLIC_MAP_ENGINE ?? "leaflet",
} as const;
