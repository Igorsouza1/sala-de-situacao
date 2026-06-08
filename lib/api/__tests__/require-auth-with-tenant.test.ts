/**
 * Testes para requireAuthWithTenant
 *
 * Cenários:
 * - Não autenticado → 401
 * - Autenticado com tenant_id no JWT → retorna tenantId real
 * - Autenticado sem tenant_id no JWT, com SEED_TENANT_ID → retorna seed (via fallback)
 * - Autenticado sem tenant_id, sem SEED → 403
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn().mockResolvedValue({ rows: [] }) } }));

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { requireAuthWithTenant } from "../require-auth";

const SEED = "seed-tenant-0000-0000-000000000000";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SEED_TENANT_ID = SEED;
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
});

afterEach(() => {
  delete process.env.SEED_TENANT_ID;
});

function mockSupabaseUser(user: any) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

it("retorna 401 quando não autenticado", async () => {
  mockSupabaseUser(null);
  const result = await requireAuthWithTenant();
  expect(result.response?.status).toBe(401);
  expect(result.tenantId).toBeNull();
});

it("retorna tenantId real do JWT quando presente", async () => {
  mockSupabaseUser({ id: "u1", email: "a@b.com", app_metadata: { tenant_id: "real-tenant-uuid" } });
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("real-tenant-uuid");
});

it("retorna SEED_TENANT_ID quando JWT sem tenant e user_access vazio", async () => {
  mockSupabaseUser({ id: "u2", email: "b@b.com", app_metadata: {} });
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe(SEED);
});

it("retorna 403 quando sem tenant no JWT, sem user_access e sem SEED", async () => {
  delete process.env.SEED_TENANT_ID;
  mockSupabaseUser({ id: "u3", email: "c@b.com", app_metadata: {} });
  const result = await requireAuthWithTenant();
  expect(result.response?.status).toBe(403);
  expect(result.tenantId).toBeNull();
});
