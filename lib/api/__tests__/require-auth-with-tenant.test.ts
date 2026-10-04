/**
 * Testes para requireAuthWithTenant (ADR 0010 — sem fallback SEED)
 *
 * Cenários:
 * - Não autenticado → 401
 * - Autenticado com tenant_id no JWT → retorna tenantId real
 * - Sem tenant no JWT → resolve via tabela roles (fonte primária)
 * - Sem roles → 403, mesmo com user_access legada
 * - Sem tenant resolvível → 403 (nunca cai num tenant padrão)
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/db", () => ({ db: { execute: jest.fn().mockResolvedValue({ rows: [] }) } }));

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { requireAuthWithTenant } from "../require-auth";

beforeEach(() => {
  jest.clearAllMocks();
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
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

it("uses metadata organization only with a current role", async () => {
  mockSupabaseUser({ id: "u1", app_metadata: { tenant_id: "real-tenant-uuid" } });
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "real-tenant-uuid" }] });
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("real-tenant-uuid");
  expect(db.execute).toHaveBeenCalledTimes(1);
});

it("resolve tenant via tabela roles quando JWT sem tenant", async () => {
  mockSupabaseUser({ id: "u2", email: "b@b.com", app_metadata: {} });
  // 1ª consulta: roles
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "tenant-via-roles" }] });
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("tenant-via-roles");
});

it("rejects a legacy association without a current role", async () => {
  mockSupabaseUser({ id: "u3", email: "c@b.com", app_metadata: {} });
  (db.execute as jest.Mock)
    .mockResolvedValueOnce({ rows: [] }) // roles
    .mockResolvedValueOnce({ rows: [{ organization_id: "tenant-via-access" }] }); // unused legacy row
  const result = await requireAuthWithTenant();
  expect(result.response?.status).toBe(403);
  expect(result.tenantId).toBeNull();
  expect(db.execute).toHaveBeenCalledTimes(1);
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
    .mockResolvedValueOnce({ rows: [{ id: "first-tenant" }] }); // tenants
  const result = await requireAuthWithTenant();
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe("first-tenant");
});

it("rejects stale metadata after all current and legacy associations are revoked", async () => {
  mockSupabaseUser({ id: "revoked", app_metadata: { tenant_id: "old-org" } });
  expect((await requireAuthWithTenant()).response?.status).toBe(403);
});
it("resolves current association instead of stale metadata", async () => {
  mockSupabaseUser({ id: "moved", app_metadata: { tenant_id: "old-org" } });
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "new-org" }] });
  expect((await requireAuthWithTenant()).tenantId).toBe("new-org");
});
it("preserves preferred organization only while currently assigned", async () => {
  mockSupabaseUser({ id: "multi", app_metadata: { tenant_id: "org-b" } });
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [{ tenant_id: "org-a" }, { tenant_id: "org-b" }] });
  expect((await requireAuthWithTenant()).tenantId).toBe("org-b");
});
it("does not revive stale metadata through legacy membership", async () => {
  mockSupabaseUser({ id: "legacy", app_metadata: { tenant_id: "old-org" } });
  (db.execute as jest.Mock).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ organization_id: "current-org" }] });
  expect((await requireAuthWithTenant()).response?.status).toBe(403);
  expect(db.execute).toHaveBeenCalledTimes(1);
});
