/**
 * Testes para app/api/acoes/[id]/route.ts — task 2.5
 *
 * Verifica:
 * - 401 para requisições não autenticadas
 * - 404 quando recurso não pertence ao tenant (proteção IDOR)
 */

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/feature-flags", () => ({ FEATURES: { MULTI_TENANT: false } }));
jest.mock("@/lib/service/acoesService", () => ({
  getAcaoDossie: jest.fn(),
  updateAcaoFieldsById: jest.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import * as acoesService from "@/lib/service/acoesService";
import { GET, PUT } from "../route";

const SEED = "seed-0000-0000-0000-000000000000";

function mockUser(user: any) {
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  });
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.SEED_TENANT_ID = SEED;
});

afterEach(() => {
  delete process.env.SEED_TENANT_ID;
});

describe("GET /api/acoes/[id]", () => {
  it("retorna 401 quando não autenticado", async () => {
    mockUser(null);

    const res = await GET(new Request("http://localhost/api/acoes/1"), makeContext("1"));

    expect(res.status).toBe(401);
    expect(acoesService.getAcaoDossie).not.toHaveBeenCalled();
  });

  it("passa tenantId para getAcaoDossie quando autenticado", async () => {
    mockUser({ id: "u1", email: "a@b.com", app_metadata: {} });
    (acoesService.getAcaoDossie as jest.Mock).mockResolvedValue({ id: 1, name: "Ação 1" });

    await GET(new Request("http://localhost/api/acoes/1"), makeContext("1"));

    expect(acoesService.getAcaoDossie).toHaveBeenCalledWith(1, SEED);
  });

  it("retorna 404 quando getAcaoDossie lança 'Ação não encontrada'", async () => {
    mockUser({ id: "u1", email: "a@b.com", app_metadata: {} });
    (acoesService.getAcaoDossie as jest.Mock).mockRejectedValue(
      new Error("Ação não encontrada")
    );

    const res = await GET(new Request("http://localhost/api/acoes/99"), makeContext("99"));

    expect(res.status).toBe(404);
  });
});

describe("PUT /api/acoes/[id]", () => {
  it("retorna 401 quando não autenticado", async () => {
    mockUser(null);
    const formData = new FormData();
    formData.append("status", "Concluído");

    const res = await PUT(
      new Request("http://localhost/api/acoes/1", { method: "PUT", body: formData }),
      makeContext("1")
    );

    expect(res.status).toBe(401);
    expect(acoesService.updateAcaoFieldsById).not.toHaveBeenCalled();
  });
});
