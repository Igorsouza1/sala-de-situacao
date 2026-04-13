/**
 * Testes para requireAuthWithTenant
 *
 * Cenários:
 * - Não autenticado → 401
 * - Autenticado, MULTI_TENANT=false → usa SEED_TENANT_ID do env
 * - Autenticado, MULTI_TENANT=true, sem tenant_id no JWT → 403
 * - Autenticado, MULTI_TENANT=true, com tenant_id no JWT → retorna tenantId real
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/feature-flags", () => ({ FEATURES: { MULTI_TENANT: false } }));

import { createClient } from "@/lib/supabase/server";
import { FEATURES } from "@/lib/feature-flags";
import { requireAuthWithTenant } from "../require-auth";

const SEED = "seed-tenant-0000-0000-000000000000";

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SEED_TENANT_ID = SEED;
});

afterEach(() => {
  delete process.env.SEED_TENANT_ID;
});

function mockSupabaseUser(user: any) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

describe("requireAuthWithTenant — MULTI_TENANT=false (feature flag off)", () => {
  beforeEach(() => {
    (FEATURES as any).MULTI_TENANT = false;
  });

  it("retorna SEED_TENANT_ID quando autenticado (sem tenant no JWT)", async () => {
    mockSupabaseUser({ id: "u1", email: "a@b.com", app_metadata: {} });

    const result = await requireAuthWithTenant();

    expect(result.response).toBeNull();
    expect(result.tenantId).toBe(SEED);
    expect(result.user).not.toBeNull();
  });

  it("retorna 401 quando não autenticado, mesmo com flag off", async () => {
    mockSupabaseUser(null);

    const result = await requireAuthWithTenant();

    expect(result.response?.status).toBe(401);
    expect(result.tenantId).toBeNull();
  });
});

describe("requireAuthWithTenant — MULTI_TENANT=true (feature flag on)", () => {
  beforeEach(() => {
    (FEATURES as any).MULTI_TENANT = true;
  });

  it("retorna tenantId real do JWT quando presente", async () => {
    mockSupabaseUser({ id: "u2", email: "b@b.com", app_metadata: { tenant_id: "real-tenant-uuid" } });

    const result = await requireAuthWithTenant();

    expect(result.response).toBeNull();
    expect(result.tenantId).toBe("real-tenant-uuid");
  });

  it("retorna 403 quando usuário autenticado mas sem tenant_id no JWT", async () => {
    mockSupabaseUser({ id: "u3", email: "c@b.com", app_metadata: {} });

    const result = await requireAuthWithTenant();

    expect(result.response?.status).toBe(403);
    expect(result.tenantId).toBeNull();
    const body = await result.response!.json();
    expect(body.error.message).toBe("Usuário sem tenant associado.");
  });

  it("retorna 401 quando não autenticado", async () => {
    mockSupabaseUser(null);

    const result = await requireAuthWithTenant();

    expect(result.response?.status).toBe(401);
  });
});
