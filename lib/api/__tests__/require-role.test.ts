/**
 * Testes para requireRole — guarda única de autorização por papel (ADR 0003/0005)
 *
 * Cenários:
 * - Superadmin passa em qualquer nível, inclusive "superadmin"
 * - Papel de tenant NUNCA satisfaz requireRole("superadmin") → 403
 * - Hierarquia: owner satisfaz "editor"; viewer não satisfaz "editor" → 403
 * - requireAdmin continua equivalente a requireRole("owner")
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const mockLimit = jest.fn();
jest.mock("@/db", () => ({
  db: {
    execute: jest.fn().mockResolvedValue({ rows: [] }),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({ limit: mockLimit })),
      })),
    })),
  },
}));

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { requireRole, requireAdmin } from "../require-auth";

const TENANT = "tenant-uuid";

beforeEach(() => {
  jest.clearAllMocks();
  (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
  mockLimit.mockResolvedValue([]);
});

function mockSupabaseUser(user: any) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) },
  });
}

const superadmin = {
  id: "sa",
  app_metadata: { is_superadmin: true, tenant_id: TENANT },
};
const tenantUser = { id: "u1", app_metadata: { tenant_id: TENANT } };

it("superadmin passa em requireRole('superadmin')", async () => {
  mockSupabaseUser(superadmin);
  const result = await requireRole("superadmin");
  expect(result.response).toBeNull();
  expect(result.tenantId).toBe(TENANT);
});

it("usuário de tenant recebe 403 em requireRole('superadmin'), mesmo sendo owner", async () => {
  mockSupabaseUser(tenantUser);
  mockLimit.mockResolvedValue([{ id: "role-1" }]); // é owner no tenant
  const result = await requireRole("superadmin");
  expect(result.response?.status).toBe(403);
  // não deve nem consultar a tabela de roles
  expect(db.select).not.toHaveBeenCalled();
});

it("owner passa em requireRole('editor') (hierarquia)", async () => {
  mockSupabaseUser(tenantUser);
  mockLimit.mockResolvedValue([{ id: "role-1" }]);
  const result = await requireRole("editor");
  expect(result.response).toBeNull();
});

it("usuário sem papel suficiente recebe 403", async () => {
  mockSupabaseUser(tenantUser);
  mockLimit.mockResolvedValue([]);
  const result = await requireRole("editor");
  expect(result.response?.status).toBe(403);
});

it("não autenticado recebe 401", async () => {
  mockSupabaseUser(null);
  const result = await requireRole("viewer");
  expect(result.response?.status).toBe(401);
});

it("requireAdmin delega para requireRole('owner')", async () => {
  mockSupabaseUser(superadmin);
  const result = await requireAdmin();
  expect(result.response).toBeNull();
});
