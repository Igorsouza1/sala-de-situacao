/**
 * Testes para requireAuthWithTenant (ADR 0010 — sem fallback SEED)
 *
 * Cenários:
 * - Não autenticado → 401
 * - Autenticado com tenant_id no JWT → retorna tenantId real
 * - Sem tenant no JWT → resolve via tabela roles (fonte primária)
 * - Sem roles → resolve via user_access (legada)
 * - Sem tenant resolvível → 403 (nunca cai num tenant padrão)
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn().mockResolvedValue({ rows: [] }) } }));
jest.mock("@/lib/api/active-region-server", () => ({ readActiveRegionId: jest.fn().mockResolvedValue(null) }));

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { readActiveRegionId } from "@/lib/api/active-region-server";
import { requireAuthWithTenant } from "../require-auth";

beforeEach(() => {
  jest.clearAllMocks();
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  (readActiveRegionId as jest.Mock).mockResolvedValue(null);
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
  // não consulta o banco quando o JWT já traz o tenant
  expect(db.execute).not.toHaveBeenCalled();
});

it("resolve tenant via tabela roles quando JWT sem tenant", async () => {
  mockSupabaseUser({ id: "u2", email: "b@b.com", app_metadata: {} });
  // 1ª consulta: roles
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "tenant-via-roles" }] });
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("tenant-via-roles");
});

it("resolve tenant via user_access quando JWT e roles vazios", async () => {
  mockSupabaseUser({ id: "u3", email: "c@b.com", app_metadata: {} });
  (db.execute as jest.Mock)
    .mockResolvedValueOnce({ rows: [] }) // roles
    .mockResolvedValueOnce({ rows: [{ organization_id: "tenant-via-access" }] }); // user_access
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("tenant-via-access");
});

it("retorna 403 quando nenhuma fonte resolve o tenant (sem fallback SEED)", async () => {
  mockSupabaseUser({ id: "u4", email: "d@b.com", app_metadata: {} });
  const result = await requireAuthWithTenant();
  expect(result.response?.status).toBe(403);
  expect(result.tenantId).toBeNull();
});

it("superadmin sem tenant explícito usa o primeiro tenant disponível", async () => {
  mockSupabaseUser({ id: "sa", email: "sa@b.com", app_metadata: { is_superadmin: true } });
  (db.execute as jest.Mock)
    .mockResolvedValueOnce({ rows: [] }) // roles
    .mockResolvedValueOnce({ rows: [] }) // user_access
    .mockResolvedValueOnce({ rows: [{ id: "first-tenant" }] }); // tenants
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("first-tenant");
});

describe("Região ativa do Superadmin", () => {
  const superadmin = { id: "sa", email: "sa@b.com", app_metadata: { is_superadmin: true } };

  it("superadmin usa o tenant dono da Região ativa, mesmo tendo role em outro tenant", async () => {
    mockSupabaseUser(superadmin);
    (readActiveRegionId as jest.Mock).mockResolvedValue(1);
    (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "tenant-da-regiao" }] }); // regioes
    const result = await requireAuthWithTenant();
    expect(result.response).toBeNull();
    expect(result.tenantId).toBe("tenant-da-regiao");
    expect(db.execute).toHaveBeenCalledTimes(1); // não precisou da cadeia roles/user_access
  });

  it("Região ativa sem Organização → superadmin cai na cadeia padrão", async () => {
    mockSupabaseUser(superadmin);
    (readActiveRegionId as jest.Mock).mockResolvedValue(99);
    (db.execute as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ tenant_id: null }] }) // regioes sem organization_id
      .mockResolvedValueOnce({ rows: [{ tenant_id: "tenant-via-roles" }] }); // roles
    const result = await requireAuthWithTenant();
    expect(result.tenantId).toBe("tenant-via-roles");
  });

  it("superadmin sem Região ativa mantém a cadeia padrão", async () => {
    mockSupabaseUser(superadmin);
    (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "tenant-via-roles" }] });
    const result = await requireAuthWithTenant();
    expect(result.tenantId).toBe("tenant-via-roles");
  });

  it("usuário comum ignora a Região ativa (isolamento de tenant)", async () => {
    mockSupabaseUser({ id: "u5", email: "e@b.com", app_metadata: { tenant_id: "meu-tenant" } });
    (readActiveRegionId as jest.Mock).mockResolvedValue(1);
    const result = await requireAuthWithTenant();
    expect(result.tenantId).toBe("meu-tenant");
    expect(readActiveRegionId).not.toHaveBeenCalled();
    expect(db.execute).not.toHaveBeenCalled();
  });
});
